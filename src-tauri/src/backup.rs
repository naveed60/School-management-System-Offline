use crate::database;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    Key, XChaCha20Poly1305, XNonce,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, path::Path};
use zeroize::Zeroize;

const MAGIC: &[u8] = b"SCHOOLFLOW-BACKUP-1\0";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupManifest {
    pub format_version: u32,
    pub schema_version: u32,
    pub app_version: String,
    pub created_at: i64,
    pub database_sha256: String,
    pub attachments: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct BackupPayload {
    manifest: BackupManifest,
    database_base64: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupResult {
    pub path: String,
    pub bytes: u64,
    pub manifest: BackupManifest,
}

pub fn create(
    connection: &Connection,
    destination: &Path,
    passphrase: &str,
    app_version: &str,
    schema_version: u32,
) -> Result<BackupResult, String> {
    validate_passphrase(passphrase)?;
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let temporary_db =
        destination.with_file_name(format!(".{}.snapshot.sqlite", database::new_id()));
    connection
        .execute(
            "VACUUM INTO ?1",
            params![temporary_db.to_string_lossy().to_string()],
        )
        .map_err(|error| error.to_string())?;

    let database_bytes = fs::read(&temporary_db).map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&temporary_db);
    let temporary_verify =
        destination.with_file_name(format!(".{}.verify.sqlite", database::new_id()));
    fs::write(&temporary_verify, &database_bytes).map_err(|error| error.to_string())?;
    let verify = Connection::open(&temporary_verify).map_err(|error| error.to_string())?;
    database::verify_integrity(&verify)?;
    verify.close().map_err(|(_, error)| error.to_string())?;
    let _ = fs::remove_file(&temporary_verify);

    let manifest = BackupManifest {
        format_version: 1,
        schema_version,
        app_version: app_version.to_string(),
        created_at: database::now_ms(),
        database_sha256: sha256_hex(&database_bytes),
        attachments: Vec::new(),
    };
    let payload = BackupPayload {
        manifest: manifest.clone(),
        database_base64: BASE64.encode(database_bytes),
    };
    let plaintext = serde_json::to_vec(&payload).map_err(|error| error.to_string())?;
    let encrypted = encrypt(passphrase, &plaintext)?;
    let temporary_output = destination.with_file_name(format!(".{}.backup", database::new_id()));
    fs::write(&temporary_output, encrypted).map_err(|error| error.to_string())?;
    fs::rename(&temporary_output, destination).map_err(|error| error.to_string())?;

    let bytes = fs::metadata(destination)
        .map_err(|error| error.to_string())?
        .len();
    Ok(BackupResult {
        path: destination.to_string_lossy().to_string(),
        bytes,
        manifest,
    })
}

pub fn restore_to_snapshot(
    backup_path: &Path,
    destination_db: &Path,
    passphrase: &str,
) -> Result<BackupManifest, String> {
    validate_passphrase(passphrase)?;
    let encrypted = fs::read(backup_path).map_err(|error| error.to_string())?;
    let plaintext = decrypt(passphrase, &encrypted)?;
    let payload: BackupPayload =
        serde_json::from_slice(&plaintext).map_err(|_| "Invalid backup payload".to_string())?;
    if payload.manifest.format_version != 1 {
        return Err("Unsupported backup format version".to_string());
    }
    if payload.manifest.schema_version > database::CURRENT_SCHEMA_VERSION {
        return Err(format!(
            "Backup schema {} is newer than this application supports ({})",
            payload.manifest.schema_version,
            database::CURRENT_SCHEMA_VERSION
        ));
    }
    let database_bytes = BASE64
        .decode(payload.database_base64)
        .map_err(|_| "Invalid database payload".to_string())?;
    if sha256_hex(&database_bytes) != payload.manifest.database_sha256 {
        return Err("Backup checksum validation failed".to_string());
    }

    let parent = destination_db
        .parent()
        .ok_or_else(|| "Invalid database path".to_string())?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let temporary_db =
        destination_db.with_file_name(format!(".{}.restore.sqlite", database::new_id()));
    fs::write(&temporary_db, database_bytes).map_err(|error| error.to_string())?;
    let verify = Connection::open(&temporary_db).map_err(|error| error.to_string())?;
    database::verify_integrity(&verify)?;
    verify.close().map_err(|(_, error)| error.to_string())?;
    fs::rename(&temporary_db, destination_db).map_err(|error| error.to_string())?;
    Ok(payload.manifest)
}

fn validate_passphrase(passphrase: &str) -> Result<(), String> {
    if passphrase.chars().count() < 10 {
        Err("Backup passphrase must contain at least 10 characters".to_string())
    } else {
        Ok(())
    }
}

fn derive_key(passphrase: &str, salt: &[u8; 16]) -> Result<[u8; 32], String> {
    let mut key = [0_u8; 32];
    argon2::Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|error| error.to_string())?;
    Ok(key)
}

fn encrypt(passphrase: &str, plaintext: &[u8]) -> Result<Vec<u8>, String> {
    let salt: [u8; 16] = rand::random();
    let nonce: [u8; 24] = rand::random();
    let mut key_bytes = derive_key(passphrase, &salt)?;
    let cipher = XChaCha20Poly1305::new(Key::from_slice(&key_bytes));
    let ciphertext = cipher
        .encrypt(XNonce::from_slice(&nonce), plaintext)
        .map_err(|_| "Backup encryption failed".to_string())?;
    key_bytes.zeroize();
    let mut output = Vec::with_capacity(MAGIC.len() + salt.len() + nonce.len() + ciphertext.len());
    output.extend_from_slice(MAGIC);
    output.extend_from_slice(&salt);
    output.extend_from_slice(&nonce);
    output.extend_from_slice(&ciphertext);
    Ok(output)
}

fn decrypt(passphrase: &str, encrypted: &[u8]) -> Result<Vec<u8>, String> {
    let header_len = MAGIC.len() + 16 + 24;
    if encrypted.len() <= header_len || &encrypted[..MAGIC.len()] != MAGIC {
        return Err("Invalid or unsupported backup file".to_string());
    }
    let salt: [u8; 16] = encrypted[MAGIC.len()..MAGIC.len() + 16]
        .try_into()
        .map_err(|_| "Invalid backup salt".to_string())?;
    let nonce_start = MAGIC.len() + 16;
    let nonce: [u8; 24] = encrypted[nonce_start..nonce_start + 24]
        .try_into()
        .map_err(|_| "Invalid backup nonce".to_string())?;
    let mut key_bytes = derive_key(passphrase, &salt)?;
    let cipher = XChaCha20Poly1305::new(Key::from_slice(&key_bytes));
    let result = cipher
        .decrypt(XNonce::from_slice(&nonce), &encrypted[header_len..])
        .map_err(|_| "Incorrect passphrase or corrupted backup".to_string());
    key_bytes.zeroize();
    result
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database;
    use rusqlite::params;

    fn cleanup(path: &Path) {
        let _ = fs::remove_file(path);
        let _ = fs::remove_file(format!("{}-wal", path.to_string_lossy()));
        let _ = fs::remove_file(format!("{}-shm", path.to_string_lossy()));
    }

    #[test]
    fn encrypted_backup_round_trips_with_integrity_checks() {
        let root = std::env::temp_dir().join(format!("schoolflow-backup-{}", database::new_id()));
        fs::create_dir_all(&root).expect("test directory");
        let db_path = root.join("source.sqlite");
        let backup_path = root.join("schoolflow.schoolbackup");
        let restored_path = root.join("restored.sqlite");
        let connection = database::open(&db_path).expect("source database");
        connection
            .execute(
                "INSERT INTO schools(id, name, country, timezone, currency, created_at, updated_at) VALUES (?1, 'Test School', 'PK', 'Asia/Karachi', 'PKR', 1, 1)",
                params![database::new_id()],
            )
            .expect("seed row");
        let result = create(
            &connection,
            &backup_path,
            "correct horse battery",
            "0.1.0",
            1,
        )
        .expect("create backup");
        assert!(result.bytes > 0);
        drop(connection);
        let manifest = restore_to_snapshot(&backup_path, &restored_path, "correct horse battery")
            .expect("restore backup");
        assert_eq!(manifest.schema_version, 1);
        let restored = database::open(&restored_path).expect("restored database");
        assert!(database::setup_complete(&restored).expect("restored setup status"));
        drop(restored);
        cleanup(&db_path);
        cleanup(&restored_path);
        let _ = fs::remove_file(&backup_path);
        let _ = fs::remove_dir(&root);
    }
}
