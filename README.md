# School Management System Offline

Production-oriented offline desktop school management system built with React, TypeScript, Vite, Tailwind CSS, Tauri, Rust and SQLite.

## Foundation milestone

This repository currently contains the foundation shell:

- Strict React + TypeScript + Vite frontend.
- Tailwind CSS through the Vite plugin.
- Tauri 2 desktop shell with a restrictive capability file and CSP baseline.
- Typed example IPC command between React and Rust.
- Single-instance desktop behavior.
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

## Architecture rules

The React layer must not access SQLite or the filesystem directly. Tauri commands remain thin; validation, authorization, transactions and domain rules belong in Rust application services. Mutable application data belongs in the OS app-data directory, never in the installation directory.

The next foundation increment will add the SQLite database worker, immutable migrations, first-run setup, authentication/RBAC, and the tested encrypted backup/restore subsystem.
# School-management-System-Offline
