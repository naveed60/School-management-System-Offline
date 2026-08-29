mod backup;
mod database;
mod security;

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager, State};

pub struct AppState {
    pub db: Mutex<Connection>,
    pub db_path: PathBuf,
    pub session: Mutex<Option<Session>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub user_id: String,
    pub school_id: String,
    pub display_name: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub app_version: String,
    pub schema_version: u32,
    pub status: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupStatus {
    pub setup_complete: bool,
    pub schema_version: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupInput {
    pub school_name: String,
    pub country: String,
    pub timezone: String,
    pub currency: String,
    pub admin_name: String,
    pub admin_email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInput {
    pub path: Option<String>,
    pub passphrase: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreInput {
    pub path: String,
    pub passphrase: String,
}

type LoginRecord = (
    String,
    String,
    String,
    String,
    String,
    String,
    i64,
    Option<i64>,
);

#[tauri::command]
fn get_app_info(app: AppHandle, state: State<'_, AppState>) -> Result<AppInfo, String> {
    let connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    Ok(AppInfo {
        app_version: app.package_info().version.to_string(),
        schema_version: database::schema_version(&connection)?,
        status: "ok",
    })
}

#[tauri::command]
fn get_setup_status(state: State<'_, AppState>) -> Result<SetupStatus, String> {
    let connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    Ok(SetupStatus {
        setup_complete: database::setup_complete(&connection)?,
        schema_version: database::schema_version(&connection)?,
    })
}

#[tauri::command]
fn complete_setup(input: SetupInput, state: State<'_, AppState>) -> Result<Session, String> {
    validate_setup(&input)?;
    let email = normalize_email(&input.admin_email)?;
    let password_hash = security::hash_password(&input.password)?;
    let mut connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;

    if database::setup_complete(&connection)? {
        return Err("School setup has already been completed".to_string());
    }

    let now = database::now_ms();
    let school_id = database::new_id();
    let role_id = database::new_id();
    let user_id = database::new_id();
    let transaction = connection
        .transaction()
        .map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO schools(id, name, country, timezone, currency, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
            params![school_id, input.school_name.trim(), input.country.trim(), input.timezone.trim(), input.currency.to_uppercase(), now],
        )
        .map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO roles(id, school_id, name, description, created_at) VALUES (?1, ?2, 'Administrator', 'Full access to the school workspace', ?3)",
            params![role_id, school_id, now],
        )
        .map_err(|error| error.to_string())?;
    let permission_id = database::new_id();
    transaction
        .execute(
            "INSERT INTO permissions(id, code, description) VALUES (?1, 'school:admin', 'Full access to the school workspace')",
            params![permission_id],
        )
        .map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO role_permissions(role_id, permission_id) VALUES (?1, ?2)",
            params![role_id, permission_id],
        )
        .map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO users(id, school_id, email, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
            params![user_id, school_id, email, input.admin_name.trim(), password_hash, now],
        )
        .map_err(|error| error.to_string())?;
    transaction
        .execute(
            "INSERT INTO user_roles(user_id, role_id) VALUES (?1, ?2)",
            params![user_id, role_id],
        )
        .map_err(|error| error.to_string())?;
    transaction
        .execute("INSERT INTO app_settings(school_id, key, value, updated_at) VALUES (?1, 'setup_complete', 'true', ?2)", params![school_id, now])
        .map_err(|error| error.to_string())?;
    transaction
        .execute("INSERT INTO audit_events(id, school_id, actor_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (?1, ?2, ?3, 'setup.completed', 'school', ?2, '{}', ?4)", params![database::new_id(), school_id, user_id, now])
        .map_err(|error| error.to_string())?;
    transaction.commit().map_err(|error| error.to_string())?;

    let session = Session {
        user_id,
        school_id,
        display_name: input.admin_name.trim().to_string(),
        email,
        role: "Administrator".to_string(),
    };
    set_session(&state, session.clone())?;
    Ok(session)
}

#[tauri::command]
fn login(input: LoginInput, state: State<'_, AppState>) -> Result<Session, String> {
    let email = normalize_email(&input.email)?;
    let now = database::now_ms();
    let connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    let user: Option<LoginRecord> = connection
        .query_row(
            "SELECT id, school_id, display_name, email, password_hash, status, failed_attempts, locked_until FROM users WHERE email = ?1",
            params![email],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let (
        user_id,
        school_id,
        display_name,
        stored_email,
        password_hash,
        status,
        failed_attempts,
        locked_until,
    ) = user.ok_or_else(|| "Invalid email or password".to_string())?;

    if status != "active" {
        return Err("This account is disabled. Contact a school administrator".to_string());
    }

    if locked_until.is_some_and(|locked| locked > now) {
        return Err("Account temporarily locked. Try again later".to_string());
    }
    if !security::verify_password(&input.password, &password_hash) {
        let next_attempts = failed_attempts.saturating_add(1);
        let lock_until = if next_attempts >= 5 {
            Some(now + 15 * 60 * 1000)
        } else {
            None
        };
        connection
            .execute("UPDATE users SET failed_attempts = ?1, locked_until = ?2, updated_at = ?3 WHERE id = ?4", params![next_attempts, lock_until, now, user_id])
            .map_err(|error| error.to_string())?;
        return Err("Invalid email or password".to_string());
    }

    let role = connection
        .query_row("SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?1 ORDER BY r.name LIMIT 1", params![user_id], |row| row.get::<_, String>(0))
        .optional()
        .map_err(|error| error.to_string())?
        .unwrap_or_else(|| "User".to_string());
    connection
        .execute("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ?1, updated_at = ?1 WHERE id = ?2", params![now, user_id])
        .map_err(|error| error.to_string())?;
    let session = Session {
        user_id,
        school_id,
        display_name,
        email: stored_email,
        role,
    };
    set_session(&state, session.clone())?;
    Ok(session)
}

#[tauri::command]
fn current_session(state: State<'_, AppState>) -> Result<Option<Session>, String> {
    state
        .session
        .lock()
        .map_err(|_| "Session lock poisoned".to_string())
        .map(|session| session.clone())
}

#[tauri::command]
fn logout(state: State<'_, AppState>) -> Result<(), String> {
    state
        .session
        .lock()
        .map_err(|_| "Session lock poisoned".to_string())
        .map(|mut session| *session = None)
}

#[tauri::command]
fn create_backup(
    input: BackupInput,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<backup::BackupResult, String> {
    let session = require_permission(&state, "school:admin")?;
    let destination = input
        .path
        .filter(|path| !path.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            state
                .db_path
                .parent()
                .unwrap_or_else(|| std::path::Path::new("."))
                .join("backups")
                .join(format!("schoolflow-{}.schoolbackup", database::now_ms()))
        });
    let connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    let result = backup::create(
        &connection,
        &destination,
        &input.passphrase,
        &app.package_info().version.to_string(),
        database::schema_version(&connection)?,
    )?;
    connection
        .execute(
            "INSERT INTO audit_events(id, school_id, actor_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (?1, ?2, ?3, 'backup.created', 'backup', NULL, ?4, ?5)",
            params![database::new_id(), session.school_id, session.user_id, serde_json::json!({"path": result.path.clone(), "sha256": result.manifest.database_sha256}).to_string(), database::now_ms()],
        )
        .map_err(|error| error.to_string())?;
    Ok(result)
}

#[tauri::command]
fn restore_backup(
    input: RestoreInput,
    state: State<'_, AppState>,
) -> Result<backup::BackupManifest, String> {
    require_permission(&state, "school:admin")?;
    let mut connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    let staging = state
        .db_path
        .with_file_name(format!(".{}.restore.sqlite", database::new_id()));
    let manifest = backup::restore_to_snapshot(
        PathBuf::from(input.path).as_path(),
        &staging,
        &input.passphrase,
    )?;
    let placeholder = Connection::open_in_memory().map_err(|error| error.to_string())?;
    let old = std::mem::replace(&mut *connection, placeholder);
    old.close().map_err(|(_, error)| error.to_string())?;
    for suffix in ["-wal", "-shm"] {
        let sidecar = PathBuf::from(format!("{}{}", state.db_path.to_string_lossy(), suffix));
        let _ = fs::remove_file(sidecar);
    }
    let rescue = state
        .db_path
        .with_file_name(format!(".{}.pre-restore.sqlite", database::new_id()));
    if state.db_path.exists() {
        fs::rename(&state.db_path, &rescue).map_err(|error| error.to_string())?;
    }
    if let Err(error) = fs::rename(&staging, &state.db_path) {
        let _ = fs::remove_file(&staging);
        let _ = fs::rename(&rescue, &state.db_path);
        *connection = database::open(&state.db_path)
            .map_err(|open_error| format!("{error}; recovery failed: {open_error}"))?;
        return Err(error.to_string());
    }
    match database::open(&state.db_path) {
        Ok(new_connection) => {
            *connection = new_connection;
            let _ = fs::remove_file(&rescue);
            state
                .session
                .lock()
                .map_err(|_| "Session lock poisoned".to_string())
                .map(|mut session| *session = None)?;
            Ok(manifest)
        }
        Err(error) => {
            let _ = fs::remove_file(&state.db_path);
            let _ = fs::rename(&rescue, &state.db_path);
            *connection = database::open(&state.db_path)?;
            Err(format!(
                "Restore validation failed and original database was recovered: {error}"
            ))
        }
    }
}

fn set_session(state: &AppState, session: Session) -> Result<(), String> {
    state
        .session
        .lock()
        .map_err(|_| "Session lock poisoned".to_string())
        .map(|mut current| *current = Some(session))
}

fn require_session(state: &AppState) -> Result<Session, String> {
    state
        .session
        .lock()
        .map_err(|_| "Session lock poisoned".to_string())?
        .clone()
        .ok_or_else(|| "Authentication required".to_string())
}

fn require_permission(state: &AppState, permission: &str) -> Result<Session, String> {
    let session = require_session(state)?;
    let connection = state
        .db
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;
    let allowed: Option<i64> = connection
        .query_row(
            "SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = ?1 AND r.school_id = ?2 AND p.code = ?3 LIMIT 1",
            params![session.user_id, session.school_id, permission],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    if allowed.is_some() {
        Ok(session)
    } else {
        Err("You do not have permission to perform this action".to_string())
    }
}

fn normalize_email(value: &str) -> Result<String, String> {
    let email = value.trim().to_lowercase();
    if email.len() < 5 || !email.contains('@') || email.contains(' ') {
        return Err("Enter a valid email address".to_string());
    }
    Ok(email)
}

fn validate_setup(input: &SetupInput) -> Result<(), String> {
    if input.school_name.trim().chars().count() < 2 {
        return Err("School name must contain at least 2 characters".to_string());
    }
    if input.country.trim().is_empty() || input.timezone.trim().is_empty() {
        return Err("Country and timezone are required".to_string());
    }
    if input.currency.trim().chars().count() != 3 {
        return Err("Currency must be a 3-letter code".to_string());
    }
    if input.admin_name.trim().chars().count() < 2 {
        return Err("Administrator name must contain at least 2 characters".to_string());
    }
    normalize_email(&input.admin_email)?;
    if input.password.chars().count() < 10 {
        return Err("Password must contain at least 10 characters".to_string());
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|error| error.to_string())?;
            fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;
            let db_path = data_dir.join("schoolflow.sqlite3");
            let connection = database::open(&db_path).map_err(|error| {
                let error: Box<dyn std::error::Error> = Box::new(std::io::Error::other(error));
                tauri::Error::Setup(error.into())
            })?;
            app.manage(AppState {
                db: Mutex::new(connection),
                db_path,
                session: Mutex::new(None),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_setup_status,
            complete_setup,
            login,
            current_session,
            logout,
            create_backup,
            restore_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running school management system");
}
