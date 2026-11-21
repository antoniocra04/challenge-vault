package web

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"mime"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"challenge-vault/internal/vault"
)

type Options struct {
	Store     *vault.Store
	Assets    fs.FS
	Password  string
	Secure    bool
	MaxUpload int64
	MaxImport int64
}

type server struct{ Options }

func New(options Options) http.Handler {
	s := &server{options}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.health)
	mux.HandleFunc("GET /api/session", s.session)
	mux.HandleFunc("POST /api/login", s.login)
	mux.HandleFunc("POST /api/logout", s.logout)
	mux.HandleFunc("GET /api/challenges", s.authorize(s.list))
	mux.HandleFunc("POST /api/challenges", s.authorize(s.create))
	mux.HandleFunc("POST /api/challenges/{id}/{action}", s.authorize(s.change))
	mux.HandleFunc("DELETE /api/challenges/{id}", s.authorize(s.delete))
	mux.HandleFunc("POST /api/attachments", s.authorize(s.upload))
	mux.HandleFunc("GET /api/attachments/{id}", s.authorize(s.download))
	mux.HandleFunc("DELETE /api/attachments/{id}", s.authorize(s.removeAttachment))
	mux.HandleFunc("GET /api/export/{format}", s.authorize(s.export))
	mux.HandleFunc("POST /api/import", s.authorize(s.importVault))
	mux.HandleFunc("/api/", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Страница не найдена."})
	})
	mux.HandleFunc("/", s.static)
	crossOrigin := http.NewCrossOriginProtection().Handler(mux)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'")
		w.Header().Set("Cache-Control", "no-store")
		crossOrigin.ServeHTTP(w, r)
	})
}

func (s *server) health(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.Ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unavailable"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) authorized(r *http.Request) bool {
	if s.Password == "" {
		return true
	}
	cookie, err := r.Cookie("cv_session")
	if err != nil {
		return false
	}
	payload, signature, ok := strings.Cut(cookie.Value, ".")
	prefix, _, haveNonce := strings.Cut(payload, "-")
	expires, err := strconv.ParseInt(prefix, 10, 64)
	return ok && haveNonce && err == nil && time.Now().Unix() < expires &&
		hmac.Equal([]byte(signature), []byte(s.sign(payload)))
}

func (s *server) sign(payload string) string {
	mac := hmac.New(sha256.New, []byte(s.Password))
	_, _ = mac.Write([]byte("challenge-vault-session-v2:" + payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *server) authorize(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.authorized(r) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Войдите в Challenge Vault."})
			return
		}
		next(w, r)
	}
}

func (s *server) session(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"enabled": s.Password != "", "authorized": s.authorized(r)})
}

func (s *server) login(w http.ResponseWriter, r *http.Request) {
	var input struct{ Password string }
	if err := parseJSON(w, r, &input); err != nil {
		fail(w, r, err)
		return
	}
	candidate := sha256.Sum256([]byte(input.Password))
	expected := sha256.Sum256([]byte(s.Password))
	if s.Password != "" && subtle.ConstantTimeCompare(candidate[:], expected[:]) != 1 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Неверный пароль."})
		return
	}
	if s.Password != "" {
		const maxAge = 365 * 24 * 60 * 60
		var nonce [16]byte
		rand.Read(nonce[:])
		expires := time.Now().Add(maxAge * time.Second)
		payload := fmt.Sprintf("%d-%s", expires.Unix(), base64.RawURLEncoding.EncodeToString(nonce[:]))
		http.SetCookie(w, s.cookie(payload+"."+s.sign(payload), maxAge))
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *server) cookie(value string, age int) *http.Cookie {
	return &http.Cookie{
		Name: "cv_session", Value: value, Path: "/", HttpOnly: true, Secure: s.Secure,
		SameSite: http.SameSiteLaxMode, MaxAge: age,
	}
}

func (s *server) logout(w http.ResponseWriter, _ *http.Request) {
	http.SetCookie(w, s.cookie("", -1))
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) list(w http.ResponseWriter, r *http.Request) {
	challenges, err := s.Store.List(r.Context())
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, challenges)
}

func (s *server) create(w http.ResponseWriter, r *http.Request) {
	var fields vault.Fields
	if err := parseJSON(w, r, &fields); err != nil {
		fail(w, r, err)
		return
	}
	c, err := s.Store.Create(r.Context(), fields)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (s *server) change(w http.ResponseWriter, r *http.Request) {
	data, err := readLimited(w, r, 1<<20)
	if err != nil {
		fail(w, r, err)
		return
	}
	c, err := s.Store.Change(r.Context(), r.PathValue("id"), r.PathValue("action"), data)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (s *server) delete(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.Delete(r.Context(), r.PathValue("id")); err != nil {
		fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, s.MaxUpload+(64<<10))
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		handleFormError(w, r, err, "Выберите файл.")
		return
	}
	defer r.MultipartForm.RemoveAll()
	f, header, err := r.FormFile("file")
	if err != nil || r.FormValue("challengeId") == "" {
		if f != nil {
			f.Close()
		}
		fail(w, r, vault.InputError("Выберите файл."))
		return
	}
	defer f.Close()
	a, err := s.Store.AttachFile(r.Context(), r.FormValue("challengeId"), header.Filename, header.Header.Get("Content-Type"),
		r.FormValue("title"), f, s.MaxUpload)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"ok": true, "id": a.ID})
}

var inlineTypes = regexp.MustCompile(`^(image/(png|jpe?g|gif|webp|avif|bmp)|audio/[a-z0-9.+-]+|video/(mp4|webm|ogg)|application/pdf|text/plain)$`)

func (s *server) download(w http.ResponseWriter, r *http.Request) {
	a, f, info, err := s.Store.FindFile(r.Context(), r.PathValue("id"))
	if err != nil {
		fail(w, r, err)
		return
	}
	defer f.Close()
	mimeType, name := "application/octet-stream", "file"
	if a.MimeType != nil {
		kind, _, err := mime.ParseMediaType(*a.MimeType)
		if err == nil {
			mimeType = kind
		}
	}
	if a.FileName != nil {
		name = *a.FileName
	}
	disposition := "attachment"
	if inlineTypes.MatchString(mimeType) && r.URL.Query().Get("download") != "1" {
		disposition = "inline"
	}
	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Content-Disposition", mime.FormatMediaType(disposition, map[string]string{"filename": name}))
	// ServeContent handles range and conditional requests, including audio seeking.
	http.ServeContent(w, r, name, info.ModTime(), f)
}

func (s *server) removeAttachment(w http.ResponseWriter, r *http.Request) {
	if err := s.Store.DeleteAttachment(r.Context(), r.PathValue("id")); err != nil {
		fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) export(w http.ResponseWriter, r *http.Request) {
	var (
		data             []byte
		err              error
		contentType, ext string
	)
	switch r.PathValue("format") {
	case "json":
		data, err = s.Store.Export(r.Context(), r.URL.Query().Get("files") != "0")
		contentType, ext = "application/json; charset=utf-8", "json"
	case "markdown":
		data, err = s.Store.Markdown(r.Context())
		contentType, ext = "text/markdown; charset=utf-8", "md"
	default:
		http.NotFound(w, r)
		return
	}
	if err != nil {
		fail(w, r, err)
		return
	}
	filename := "challenge-vault-" + time.Now().Local().Format("2006-01-02") + "." + ext
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": filename}))
	_, _ = w.Write(data)
}

func (s *server) importVault(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "merge"
	}
	if mode != "merge" && mode != "replace" {
		fail(w, r, vault.InputError("Неизвестный режим импорта."))
		return
	}
	var data []byte
	if strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		r.Body = http.MaxBytesReader(w, r.Body, s.MaxImport+(64<<10))
		if err := r.ParseMultipartForm(2 << 20); err != nil {
			handleFormError(w, r, err, "Выберите JSON-файл.")
			return
		}
		defer r.MultipartForm.RemoveAll()
		f, header, err := r.FormFile("file")
		if err != nil {
			fail(w, r, vault.InputError("Выберите JSON-файл."))
			return
		}
		defer f.Close()
		if header.Size > s.MaxImport {
			fail(w, r, &http.MaxBytesError{Limit: s.MaxImport})
			return
		}
		data, err = io.ReadAll(f)
		if err != nil {
			fail(w, r, err)
			return
		}
	} else {
		var err error
		data, err = readLimited(w, r, s.MaxImport)
		if err != nil {
			fail(w, r, err)
			return
		}
	}
	imported, err := s.Store.Import(r.Context(), data, mode)
	if err != nil {
		fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "result": imported})
}

func handleFormError(w http.ResponseWriter, r *http.Request, err error, fallback string) {
	var sizeError *http.MaxBytesError
	if errors.As(err, &sizeError) {
		fail(w, r, err)
		return
	}
	fail(w, r, vault.InputError(fallback))
}

func readLimited(w http.ResponseWriter, r *http.Request, limit int64) ([]byte, error) {
	return io.ReadAll(http.MaxBytesReader(w, r.Body, limit))
}

func parseJSON(w http.ResponseWriter, r *http.Request, target any) error {
	data, err := readLimited(w, r, 1<<20)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, target); err != nil {
		return vault.InputError("Не удалось прочитать данные.")
	}
	return nil
}

func fail(w http.ResponseWriter, r *http.Request, err error) {
	status, message := http.StatusInternalServerError, "Ошибка сервера."
	var inputError vault.InputError
	var sizeError *http.MaxBytesError
	switch {
	case errors.Is(err, vault.ErrNotFound), errors.Is(err, vault.ErrAttachmentNotFound):
		status, message = http.StatusNotFound, err.Error()
	case errors.Is(err, vault.ErrUploadTooLarge), errors.As(err, &sizeError):
		status, message = http.StatusRequestEntityTooLarge, "Файл слишком большой."
	case errors.As(err, &inputError):
		status, message = http.StatusBadRequest, inputError.Error()
	default:
		slog.Error("request failed", "method", r.Method, "path", r.URL.Path, "error", err)
	}
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (s *server) static(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	p := r.URL.Path
	if s.Assets == nil {
		http.NotFound(w, r)
		return
	}
	if strings.HasPrefix(p, "/assets/") || p == "/favicon.svg" {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		http.ServeFileFS(w, r, s.Assets, strings.TrimPrefix(p, "/"))
		return
	}
	// Each bookmark enters the static SPA at the same document. The router
	// owns the visible not-found state for other paths.
	http.ServeFileFS(w, r, s.Assets, "index.html")
}
