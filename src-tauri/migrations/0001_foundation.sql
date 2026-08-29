CREATE TABLE schools (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) >= 2),
    legal_name TEXT,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    currency TEXT NOT NULL CHECK (length(currency) = 3),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE roles (
    id TEXT PRIMARY KEY NOT NULL,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE(school_id, name)
);

CREATE TABLE permissions (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    school_id TEXT NOT NULL REFERENCES schools(id),
    email TEXT NOT NULL,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) >= 2),
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until INTEGER,
    last_login_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(school_id, email)
);

CREATE TABLE user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, role_id)
);

CREATE TABLE app_settings (
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(school_id, key)
);

CREATE TABLE audit_events (
    id TEXT PRIMARY KEY NOT NULL,
    school_id TEXT REFERENCES schools(id),
    actor_user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_users_school_email ON users(school_id, email);
CREATE INDEX idx_audit_school_created ON audit_events(school_id, created_at DESC);
