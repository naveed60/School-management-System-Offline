use rusqlite::{params, Connection, OptionalExtension};
use std::{
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

pub fn new_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn open(path: &Path) -> Result<Connection, String> {
    let mut connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection
        .busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|error| error.to_string())?;
    connection
        .pragma_update(None, "foreign_keys", true)
        .map_err(|error| error.to_string())?;
    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| error.to_string())?;
    connection
        .pragma_update(None, "synchronous", "FULL")
        .map_err(|error| error.to_string())?;
    migrate(&mut connection)?;
    Ok(connection)
}

pub fn migrate(connection: &mut Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS _schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);",
        )
        .map_err(|error| error.to_string())?;

    let migrations: &[(u32, &str, &str)] = &[(
        1,
        "foundation",
        include_str!("../migrations/0001_foundation.sql"),
    )];

    for (version, name, sql) in migrations {
        let applied: Option<u32> = connection
            .query_row(
                "SELECT version FROM _schema_migrations WHERE version = ?1",
                params![version],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| error.to_string())?;

        if applied.is_none() {
            let transaction = connection
                .transaction()
                .map_err(|error| error.to_string())?;
            transaction
                .execute_batch(sql)
                .map_err(|error| error.to_string())?;
            transaction
                .execute(
                    "INSERT INTO _schema_migrations(version, name, applied_at) VALUES (?1, ?2, ?3)",
                    params![version, name, now_ms()],
                )
                .map_err(|error| error.to_string())?;
            transaction.commit().map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

pub fn schema_version(connection: &Connection) -> Result<u32, String> {
    let version: u32 = connection
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM _schema_migrations",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    if version > CURRENT_SCHEMA_VERSION {
        return Err(format!(
            "Database schema {version} is newer than this application supports ({CURRENT_SCHEMA_VERSION})"
        ));
    }
    Ok(version)
}

pub fn setup_complete(connection: &Connection) -> Result<bool, String> {
    let count: i64 = connection
        .query_row("SELECT COUNT(*) FROM schools", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    Ok(count > 0)
}

pub fn verify_integrity(connection: &Connection) -> Result<(), String> {
    let result: String = connection
        .query_row("PRAGMA quick_check", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    if result != "ok" {
        return Err(format!("SQLite integrity check failed: {result}"));
    }

    let mut statement = connection
        .prepare("PRAGMA foreign_key_check")
        .map_err(|error| error.to_string())?;
    let mut rows = statement.query([]).map_err(|error| error.to_string())?;
    if rows.next().map_err(|error| error.to_string())?.is_some() {
        return Err("SQLite foreign-key check failed".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn cleanup(path: &Path) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(format!("{}-wal", path.to_string_lossy()));
        let _ = fs::remove_file(format!("{}-shm", path.to_string_lossy()));
    }

    #[test]
    fn opens_and_migrates_a_new_database() {
        let path = std::env::temp_dir().join(format!("schoolflow-db-{}.sqlite", new_id()));
        let connection = open(&path).expect("database should open");
        assert_eq!(
            schema_version(&connection).expect("schema version"),
            CURRENT_SCHEMA_VERSION
        );
        assert!(!setup_complete(&connection).expect("setup status"));
        verify_integrity(&connection).expect("database should be valid");
        drop(connection);
        cleanup(&path);
    }
}
