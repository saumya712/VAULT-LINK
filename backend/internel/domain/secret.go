package domain

import "time"

type Secret struct {
	Id             string    `db:"id"`
	Ciphertext     []byte    `db:"ciphertext"`
	PassphraseHash string    `db:"passphrase_hash"`
	Expiresat      time.Time `db:"expires_at"`
	Createdat      time.Time `db:"created_at"`
}

type Createsecretinput struct {
	Content    string
	Ttlhours   int
	Passphrase string
}

type Createsecretoutput struct {
	URL       string
	Expiresat time.Time
}

type Retriveoutput struct {
	Content            string
	Requirespassphrase bool
}

type Secretrepo interface {
	Insert(secret *Secret) error
	Peek(id string) (*Secret, error)
	Fetchanddelete(id string) (*Secret, error)
	Deleteexpired() (int64, error)
}
