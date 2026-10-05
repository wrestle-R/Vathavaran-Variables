package varte

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5" // Required by the existing CryptoJS OpenSSL passphrase format.
	"crypto/rand"
	"encoding/base64"
	"errors"
	"unicode/utf8"
)

func derive(passphrase string, salt []byte) ([]byte, []byte) {
	var material, previous []byte
	for len(material) < 48 {
		hash := md5.New()
		hash.Write(previous)
		hash.Write([]byte(passphrase))
		hash.Write(salt)
		previous = hash.Sum(nil)
		material = append(material, previous...)
	}
	return material[:32], material[32:48]
}

func Encrypt(content []byte, passphrase string) (string, error) {
	salt := make([]byte, 8)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	return encryptWithSalt(content, passphrase, salt)
}

func encryptWithSalt(content []byte, passphrase string, salt []byte) (string, error) {
	if passphrase == "" || len(salt) != 8 {
		return "", errors.New("encryption passphrase and 8-byte salt required")
	}
	key, iv := derive(passphrase, salt)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	pad := aes.BlockSize - len(content)%aes.BlockSize
	padded := append(append([]byte(nil), content...), bytes.Repeat([]byte{byte(pad)}, pad)...)
	ciphertext := make([]byte, len(padded))
	cipher.NewCBCEncrypter(block, iv).CryptBlocks(ciphertext, padded)
	payload := append(append([]byte("Salted__"), salt...), ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func Decrypt(encoded, passphrase string) ([]byte, error) {
	invalid := errors.New("could not decrypt file: wrong key or damaged ciphertext")
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil || len(data) < 32 || !bytes.Equal(data[:8], []byte("Salted__")) || (len(data)-16)%aes.BlockSize != 0 || passphrase == "" {
		return nil, invalid
	}
	key, iv := derive(passphrase, data[8:16])
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	plain := make([]byte, len(data)-16)
	cipher.NewCBCDecrypter(block, iv).CryptBlocks(plain, data[16:])
	pad := int(plain[len(plain)-1])
	if pad < 1 || pad > aes.BlockSize || pad > len(plain) {
		return nil, invalid
	}
	if !bytes.Equal(plain[len(plain)-pad:], bytes.Repeat([]byte{byte(pad)}, pad)) {
		return nil, invalid
	}
	plain = plain[:len(plain)-pad]
	if !utf8.Valid(plain) {
		return nil, invalid
	}
	return plain, nil
}
