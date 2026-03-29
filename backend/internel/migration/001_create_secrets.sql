CREATE EXTENSION IF NOT EXISTS PGCRYPTO

CREATE TABLE IF NOT EXISTS secrets (
    id char(64) primary key,

    ciphertext BYTEA  not null,

    passphrase text not null,

    expires_at timestampz not null,

    creted_at timestampz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at);