package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
)

const (
	tokenbytelength = 32
	noncesize       = 12
)

func Generatetoken() (rawtoken string, tokenhash string, err error) {
	bytes := make([]byte, tokenbytelength)

	if _, err := io.ReadFull(rand.Reader, bytes); err != nil {
		return "", "", err
	}

	rawtoken = base64.RawURLEncoding.EncodeToString(bytes)

	hash := sha256.Sum256(bytes)

	tokenhash = hex.EncodeToString(hash[:])

	return rawtoken, tokenhash, nil
}

func Tokentohash(rawtoken string) (string, error) {
	bytes, err := base64.RawURLEncoding.DecodeString(rawtoken)
	if err != nil {
		return "", errors.New("invalid tooken format")
	}
    hash:=sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:]),nil
}

func derivekey(rawtoken string) ([]byte,error) {
	bytes,err:=base64.RawURLEncoding.DecodeString(rawtoken)
	if err!=nil{
		return nil,errors.New("invalid token format")
	}

	input:=append(bytes,[]byte("enc")...)
	key:=sha256.Sum256(input)

	return key[:],nil
}

func Encrypt(plaintext, rawtoken string) ([]byte,error) {
	key,err:=derivekey(rawtoken)
	if err!=nil{
		return nil,errors.New("cant derive key")
	}
	block,err:=aes.NewCipher(key)
	if err!=nil{
		return nil,err
	}
	gcm, err:= cipher.NewGCM(block)
	if err!=nil{
		return nil,err
	}

	nonce:=make([]byte,noncesize)
	if _,err:=io.ReadFull(rand.Reader,nonce);err!=nil{
		return nil,err
	}

	ciphertext:=gcm.Seal(nonce,nonce,[]byte(plaintext),nil)
	return ciphertext,nil
}

func Decrypt(blob []byte,rawtoken string) (string,error) {
	key,err:=derivekey(rawtoken)
	if err!=nil{
		return "",err
	}

	block,err:=aes.NewCipher(key)
	if err!=nil{
		return "",err
	}

	gcm,err:=cipher.NewGCM(block)
	if err!=nil{
		return "",err
	}

	if len(blob) < noncesize+gcm.Overhead() {
		return "",err
	}

	nonce,ciphertext:=blob[:noncesize],blob[noncesize:]
	

	plaintext, err:=gcm.Open(nil,nonce,ciphertext,nil)
	if err!=nil{
		return "",err
	}
	return string(plaintext),nil
}