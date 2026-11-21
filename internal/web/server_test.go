package web

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"challenge-vault/internal/vault"
)

func TestAuthGuardsDataAndAllowsSessionFlow(t *testing.T) {
	dir := t.TempDir()
	store, err := vault.Open(filepath.Join(dir, "vault.sqlite"), filepath.Join(dir, "uploads"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	app := New(Options{Store: store, Password: "vaultpassword",
		Assets:    fstest.MapFS{"index.html": {Data: []byte("<main>Vault</main>")}},
		MaxUpload: 1024, MaxImport: 1024,
	})
	makeRequest := func(method, path, body string, cookie *http.Cookie) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		if cookie != nil {
			r.AddCookie(cookie)
		}
		app.ServeHTTP(w, r)
		return w
	}
	if got := makeRequest("GET", "/api/challenges", "", nil).Code; got != http.StatusUnauthorized {
		t.Fatalf("unauthenticated data status %d", got)
	}
	login := makeRequest("POST", "/api/login", `{"password":"vaultpassword"}`, nil)
	if login.Code != http.StatusOK || len(login.Result().Cookies()) != 1 || !login.Result().Cookies()[0].HttpOnly {
		t.Fatalf("login did not issue a session: %d, %v", login.Code, login.Result().Cookies())
	}
	cookie := login.Result().Cookies()[0]
	created := makeRequest("POST", "/api/challenges", `{"title":"Панорама"}`, cookie)
	if created.Code != http.StatusCreated {
		t.Fatalf("create: %d %s", created.Code, created.Body)
	}
	if got := makeRequest("GET", "/api/export/json", "", cookie); got.Code != http.StatusOK || !strings.Contains(got.Body.String(), "Панорама") {
		t.Fatalf("export: %d %s", got.Code, got.Body)
	}
	if got := makeRequest("GET", "/challenge/saved-link", "", nil); got.Code != http.StatusOK || !strings.Contains(got.Body.String(), "Vault") {
		t.Fatalf("deep link: %d %s", got.Code, got.Body)
	}
}

func TestFileUploadRangeAndDeletion(t *testing.T) {
	dir := t.TempDir()
	store, err := vault.Open(filepath.Join(dir, "vault.sqlite"), filepath.Join(dir, "uploads"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	c, err := store.Create(context.Background(), vault.Fields{Title: "Сигнал"})
	if err != nil {
		t.Fatal(err)
	}
	app := New(Options{Store: store, MaxUpload: 10})
	var payload bytes.Buffer
	form := multipart.NewWriter(&payload)
	if err := form.WriteField("challengeId", c.ID); err != nil {
		t.Fatal(err)
	}
	file, err := form.CreateFormFile("file", "signal.txt")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := file.Write([]byte("abcdef")); err != nil {
		t.Fatal(err)
	}
	if err := form.Close(); err != nil {
		t.Fatal(err)
	}
	upload := httptest.NewRequest("POST", "/api/attachments", &payload)
	upload.Header.Set("Content-Type", form.FormDataContentType())
	w := httptest.NewRecorder()
	app.ServeHTTP(w, upload)
	var result struct{ ID string }
	if w.Code != http.StatusCreated || json.Unmarshal(w.Body.Bytes(), &result) != nil || result.ID == "" {
		t.Fatalf("upload: %d %s", w.Code, w.Body)
	}
	path := "/api/attachments/" + result.ID
	get := httptest.NewRequest("GET", path, nil)
	get.Header.Set("Range", "bytes=1-3")
	w = httptest.NewRecorder()
	app.ServeHTTP(w, get)
	if w.Code != http.StatusPartialContent || w.Body.String() != "bcd" || !strings.HasPrefix(w.Header().Get("Content-Disposition"), "attachment") {
		t.Fatalf("file range response: %d, %s", w.Code, w.Body)
	}
	w = httptest.NewRecorder()
	app.ServeHTTP(w, httptest.NewRequest("DELETE", path, nil))
	if w.Code != http.StatusNoContent {
		t.Fatalf("file delete response: %d, %s", w.Code, w.Body)
	}
	w = httptest.NewRecorder()
	app.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
	if w.Code != http.StatusNotFound {
		t.Fatalf("deleted file response: %d, %s", w.Code, w.Body)
	}
}
