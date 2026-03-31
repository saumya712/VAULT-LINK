package repo

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func NewPostgres(databaseURL string) *sqlx.DB {
	db, err := sqlx.Connect("postgres", databaseURL)
	if err != nil {
		log.Fatalf("FATAL: could not connect to database: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	runMigrations(db) // ← make sure this line exists

	fmt.Println("✓ Connected to PostgreSQL")
	return db
}

func runMigrations(db *sqlx.DB) {
	query := `
    CREATE TABLE IF NOT EXISTS secrets (
        id              CHAR(64)        PRIMARY KEY,
        ciphertext      BYTEA           NOT NULL,
        passphrase_hash TEXT            NOT NULL DEFAULT '',
        expires_at      TIMESTAMPTZ     NOT NULL,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at);
    `
	if _, err := db.Exec(query); err != nil {
		log.Fatalf("FATAL: could not run migrations: %v", err)
	}
	fmt.Println("✓ Migrations applied")
}
