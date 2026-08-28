# Foundation architecture

## Runtime boundary

The React UI communicates with Rust through explicit Tauri commands. Commands accept and return serializable DTOs and must not contain business rules. Rust application services own authorization, validation, transaction boundaries and audit events.

## Data boundary

SQLite is local to one installation and one host. The database path is resolved with Tauri's application-data directory. It must not be placed on a network share. A future multi-workstation edition will replace repository implementations with a local/server API while keeping the domain and frontend contracts stable.

## Security baseline

Capabilities are intentionally minimal. New native functionality requires a narrowly scoped capability and command. No remote script or CDN is allowed in production. Secrets must never be committed, placed in frontend storage, or written to logs.
