package varte

import (
	"encoding/json"
	"os"
	"testing"
)

func TestCryptoJSLegacyFixture(t *testing.T) {
	raw, err := os.ReadFile("fixture.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct{ Passphrase, Plaintext, Encrypted string }
	if err = json.Unmarshal(raw, &fixture); err != nil {
		t.Fatal(err)
	}
	plain, err := Decrypt(fixture.Encrypted, fixture.Passphrase)
	if err != nil || string(plain) != fixture.Plaintext {
		t.Fatalf("legacy decrypt: %v", err)
	}
	encrypted, err := encryptWithSalt([]byte(fixture.Plaintext), fixture.Passphrase, []byte{1, 2, 3, 4, 5, 6, 7, 8})
	if err != nil || encrypted != fixture.Encrypted {
		t.Fatalf("legacy ciphertext mismatch: %v", err)
	}
}
func TestCiphertextValidation(t *testing.T) {
	for _, value := range []string{"", "not-base64", "U2FsdGVkX18=", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="} {
		if _, err := Decrypt(value, "key"); err == nil {
			t.Fatal("accepted malformed ciphertext")
		}
	}
	for _, content := range []string{"", "A", "sixteen-byte-msg!", "value=hello\n"} {
		encrypted, err := Encrypt([]byte(content), "key")
		if err != nil {
			t.Fatal(err)
		}
		plain, err := Decrypt(encrypted, "key")
		if err != nil || string(plain) != content {
			t.Fatalf("round trip: %v", err)
		}
	}
}
