package repo

import (
	"VAULT-LINK/internel/domain"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Secretrepo struct {
	db *sqlx.DB
}

func Newsecretrepo(db *sqlx.DB) domain.Secretrepo {
	return &Secretrepo{db: db}
}

func (r *Secretrepo) Insert(secret *domain.Secret) error {
	query := `
		INSERT INTO secrets (id, ciphertext, passphrase_hash, expires_at, created_at)
		VALUES (:id, :ciphertext, :passphrase_hash, :expires_at, :created_at)
	`

	_, err := r.db.NamedExec(query, secret)
	if err != nil {
		return fmt.Errorf("insert:%w", err)
	}

	return nil
}

func (r *Secretrepo) Fetchanddelete(id string) (*domain.Secret, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("fetch and delete: begin tx: %w", err)
	}

	defer tx.Rollback()

	var secret domain.Secret

	query := `
		SELECT id, ciphertext, passphrase_hash, expires_at, created_at
		FROM secrets
		WHERE id = $1
		FOR UPDATE
	`

	err = tx.Get(&secret, query, id)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(`delete from secrets where id = $1`, id)
	if err != nil {
		return nil, fmt.Errorf("Fetchanddelete delete: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("fetchanddelete:commit : %w", err)
	}

	return &secret, nil
}

func (r *Secretrepo) Deleteexpired() (int64, error) {
	result, err := r.db.Exec(`delete from secrets where expires_at < now()`)
	if err != nil {
		return 0, fmt.Errorf("deleteexpired %w", err)
	}

	count, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("deleteexpired:rows affected:%w", err)
	}
	return count, nil
}

func (r *Secretrepo) Peek(id string) (*domain.Secret, error) {
	var secret domain.Secret
	query := `SELECT id, ciphertext, passphrase_hash, expires_at, created_at
              FROM secrets WHERE id = $1`
	err := r.db.Get(&secret, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("Peek: %w", err)
	}
	return &secret, nil
}
