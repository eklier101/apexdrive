package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"strings"
	"time"

	"golang.org/x/crypto/pbkdf2"
)

type UserPayload struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type tokenBody struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Exp      int64  `json:"exp"`
	Iat      int64  `json:"iat"`
}

const RoleAdmin = "admin"
const RoleUser = "user"

func NormalizeRole(role string) string {
	if strings.EqualFold(strings.TrimSpace(role), RoleAdmin) {
		return RoleAdmin
	}
	return RoleUser
}

func IsAdmin(role string) bool {
	return NormalizeRole(role) == RoleAdmin
}

func HashPassword(password string) (hash string, salt string, err error) {
	saltBytes := make([]byte, 16)
	if _, err = rand.Read(saltBytes); err != nil {
		return "", "", err
	}
	salt = hex.EncodeToString(saltBytes)
	dk := pbkdf2.Key([]byte(password), []byte(salt), 10000, 64, sha512.New)
	hash = hex.EncodeToString(dk)
	return hash, salt, nil
}

func VerifyPassword(password, hash, salt string) bool {
	dk := pbkdf2.Key([]byte(password), []byte(salt), 10000, 64, sha512.New)
	verify := hex.EncodeToString(dk)
	a, err1 := hex.DecodeString(hash)
	b, err2 := hex.DecodeString(verify)
	if err1 != nil || err2 != nil || len(a) != len(b) {
		return false
	}
	return subtle.ConstantTimeCompare(a, b) == 1
}

func GenerateToken(secret string, payload UserPayload) (string, error) {
	headerJSON, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	now := time.Now().Unix()
	body := tokenBody{
		UserID:   payload.UserID,
		Username: payload.Username,
		Role:     NormalizeRole(payload.Role),
		Exp:      now + 60*60*24*365,
		Iat:      now,
	}
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	h := base64.RawURLEncoding.EncodeToString(headerJSON)
	b := base64.RawURLEncoding.EncodeToString(bodyJSON)
	sig := sign(secret, h+"."+b)
	return h + "." + b + "." + sig, nil
}

func VerifyToken(secret, token string) (*UserPayload, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, false
	}
	expected := sign(secret, parts[0]+"."+parts[1])
	if !hmac.Equal([]byte(parts[2]), []byte(expected)) {
		return nil, false
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, false
	}
	var body tokenBody
	if err := json.Unmarshal(raw, &body); err != nil {
		return nil, false
	}
	if body.Exp > 0 && body.Exp < time.Now().Unix() {
		return nil, false
	}
	return &UserPayload{
		UserID:   body.UserID,
		Username: body.Username,
		Role:     NormalizeRole(body.Role),
	}, true
}

func sign(secret, data string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
