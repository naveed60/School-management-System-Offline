# School Management System Offline

Production-oriented offline desktop school management system built with React, TypeScript, Vite, Tailwind CSS, Tauri, Rust and SQLite.

## Foundation milestone

This repository currently contains the foundation shell and the first persistence slice:

- Strict React + TypeScript + Vite frontend.
- Tailwind CSS through the Vite plugin.
- Tauri 2 desktop shell with a restrictive capability file and CSP baseline.
- Typed example IPC command between React and Rust.
- Single-instance desktop behavior.
- Bundled SQLite database with transactional, embedded migrations and WAL/full-sync durability settings.
- First-run school and administrator onboarding with Argon2id password hashing.
- Local login session, account lockout, role/permission seed and audit events.
- Encrypted XChaCha20-Poly1305 database backups with checksum/integrity validation and restore recovery.
- Native runtime screens for setup, sign-in and the first workspace shell; browser preview remains the marketing landing page.
- Vitest and Testing Library smoke test.
- Rust formatting and linting toolchain pin.

## Local development

Install Node.js 22+, npm, Rust stable and the Tauri platform prerequisites for your operating system.

```bash
npm install
npm run dev
npm run tauri:dev
```

Run quality checks:

```bash
npm run build
npm run lint
npm test
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Build a release installer for the current operating system:

```bash
npm run tauri:build
```

Tauri bundles platform-native installers (for example, `.deb`/`.rpm`/AppImage on Linux, `.msi`/NSIS on Windows and `.app`/DMG on macOS). Build each target on its native CI runner for reproducible signing and packaging.

## Architecture rules

The React layer must not access SQLite or the filesystem directly. Tauri commands remain thin; validation, authorization, transactions and domain rules belong in Rust application services. Mutable application data belongs in the OS app-data directory, never in the installation directory.

The next increment will add the student/admissions domain and its repository/service layer, followed by attendance, fees, reporting and role administration modules. Backup attachments, scheduled backups and OS file-picker integration will be added as those modules introduce documents and exports.
# School-management-System-Offline
