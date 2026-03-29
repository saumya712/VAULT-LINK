package service

import (
	"VAULT-LINK/internel/crypto"
	"VAULT-LINK/internel/domain"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Secretservice struct {
	repo   domain.Secretrepo
	appURL string
}

func Newsecretservice(repo domain.Secretrepo, appURL string) *Secretservice {
	return &Secretservice{
		repo:   repo,
		appURL: appURL,
	}
}

func (s *Secretservice) Createsecret(input domain.Createsecretinput) (*domain.Createsecretoutput, error) {
	rawtoken, tokenhash, err := crypto.Generatetoken()
	if err != nil {
		return nil, fmt.Errorf("CreateSecret: generate token: %w", err)
	}

	ciphertext, err := crypto.Encrypt(input.Content, rawtoken)
	if err != nil {
		return nil, fmt.Errorf("CreateSecret: encrypt: %w", err)
	}

	passphrase := ""
	if input.Passphrase != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Passphrase), 12)
		if err != nil {
			return nil, fmt.Errorf("cretesecret:hash passphrase: %w", err)
		}
		passphrase = string(hash)
	}

	now := time.Now().UTC()
	secret := &domain.Secret{
		Id:             tokenhash,
		Ciphertext:     ciphertext,
		PassphraseHash: passphrase,
		Expiresat:      now.Add(time.Duration(input.Ttlhours) * time.Hour),
		Createdat:      now,
	}

	if err := s.repo.Insert(secret); err != nil {
		return nil, fmt.Errorf("CreateSecret: insert: %w", err)
	}

	return &domain.Createsecretoutput{
		URL:       fmt.Sprintf("%s/s/%s", s.appURL, rawtoken),
		Expiresat: secret.Expiresat,
	}, nil
}

func (s *Secretservice) RetrieveSecret(rawToken, passphrase string) (*domain.Retriveoutput, error) {
    tokenHash, err := crypto.Tokentohash(rawToken)
    if err != nil {
        return nil, fmt.Errorf("RetrieveSecret: invalid token: %w", err)
    }

    // PEEK first — check existence and passphrase requirement WITHOUT deleting
    secret, err := s.repo.Peek(tokenHash)
    if err != nil {
        return nil, fmt.Errorf("RetrieveSecret: peek: %w", err)
    }
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    // Check expiry
    if time.Now().UTC().After(secret.Expiresat) {
        return nil, ErrSecretNotFound
    }

    // If passphrase required but not provided — tell frontend to show the form
    if secret.PassphraseHash != "" && passphrase == "" {
        return nil, ErrPassphraseRequired
    }

    // If passphrase required — verify it before deleting
    if secret.PassphraseHash != "" {
        err := bcrypt.CompareHashAndPassword([]byte(secret.PassphraseHash), []byte(passphrase))
        if err != nil {
            if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
                return nil, ErrInvalidPassphrase
            }
            return nil, fmt.Errorf("RetrieveSecret: compare passphrase: %w", err)
        }
    }

    // Passphrase verified (or not needed) — NOW atomically fetch and delete
    secret, err = s.repo.Fetchanddelete(tokenHash)
    if err != nil {
        return nil, fmt.Errorf("RetrieveSecret: fetch: %w", err)
    }
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    // Decrypt
    content, err := crypto.Decrypt(secret.Ciphertext, rawToken)
    if err != nil {
        return nil, fmt.Errorf("RetrieveSecret: decrypt: %w", err)
    }

    return &domain.Retriveoutput{
        Content:            content,
        Requirespassphrase: secret.PassphraseHash != "",
    }, nil
}


var (
	ErrSecretNotFound    = errors.New("secret not found or already accessed")
	ErrPassphraseRequired = errors.New("passphrase required")
	ErrInvalidPassphrase  = errors.New("invalid passphrase")
)