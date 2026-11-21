package vault

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	_ "modernc.org/sqlite"
)

type InputError string

func (err InputError) Error() string { return string(err) }

var ErrNotFound = errors.New("Идея не найдена.")
var ErrAttachmentNotFound = errors.New("Вложение не найдено.")

type Fields struct {
	Title               string   `json:"title"`
	Description         *string  `json:"description"`
	Spark               *string  `json:"spark"`
	Category            *string  `json:"category"`
	Tags                []string `json:"tags"`
	EstimatedDuration   *int     `json:"estimatedDuration"`
	RequiresLeavingHome *bool    `json:"requiresLeavingHome"`
	RequiresMoney       *bool    `json:"requiresMoney"`
}

type Outcome struct {
	Result         *string `json:"result"`
	EnjoymentScore *int    `json:"enjoymentScore"`
	ActualDuration *int    `json:"actualDuration"`
}

type Challenge struct {
	ID string `json:"id"`
	Fields
	Outcome
	Status           string       `json:"status"`
	Favorite         bool         `json:"favorite"`
	AbandonReason    *string      `json:"abandonReason"`
	TrackedSeconds   int          `json:"trackedSeconds"`
	SessionStartedAt *time.Time   `json:"sessionStartedAt"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
	StartedAt        *time.Time   `json:"startedAt"`
	CompletedAt      *time.Time   `json:"completedAt"`
	AbandonedAt      *time.Time   `json:"abandonedAt"`
	Log              []Entry      `json:"log"`
	Attachments      []Attachment `json:"attachments"`
}

type Entry struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Kind      string    `json:"kind"`
	CreatedAt time.Time `json:"createdAt"`
}

type Attachment struct {
	ID         string    `json:"id"`
	Kind       string    `json:"kind"`
	Title      *string   `json:"title"`
	URL        *string   `json:"url"`
	Content    *string   `json:"content"`
	FileName   *string   `json:"fileName"`
	MimeType   *string   `json:"mimeType"`
	Size       *int      `json:"size"`
	StorageKey *string   `json:"storageKey"`
	CreatedAt  time.Time `json:"createdAt"`
	Data       *[]byte   `json:"data,omitempty"`
}

type Store struct {
	db      *sql.DB
	uploads *os.Root
	// Keep file operations in order with their associated SQLite transaction.
	mu  sync.RWMutex
	now func() time.Time
}

func Open(filename, uploads string) (*Store, error) {
	filename, err := filepath.Abs(filename)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(filename), 0700); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(uploads, 0700); err != nil {
		return nil, err
	}
	root, err := os.OpenRoot(uploads)
	if err != nil {
		return nil, err
	}
	dsn := url.URL{Scheme: "file", Path: filename, RawQuery: "_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_txlock=immediate"}
	db, err := sql.Open("sqlite", dsn.String())
	if err != nil {
		root.Close()
		return nil, err
	}
	db.SetMaxOpenConns(1)
	store := &Store{db: db, uploads: root, now: time.Now}
	// The complete single-user record is one atomic unit, including lifecycle
	// events and attachment metadata. File bytes live in the uploads volume.
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS challenges (
		id TEXT PRIMARY KEY,
		record TEXT NOT NULL CHECK(json_valid(record) AND json_extract(record, '$.id') IS id)
	) STRICT`); err != nil {
		store.Close()
		return nil, err
	}
	return store, nil
}

func (s *Store) Close() error                   { return errors.Join(s.db.Close(), s.uploads.Close()) }
func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }
func (s *Store) currentTime() time.Time         { return s.now().UTC().Truncate(time.Millisecond) }

func (s *Store) List(ctx context.Context) ([]Challenge, error) {
	return list(ctx, s.db)
}

type queryer interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

func list(ctx context.Context, db queryer) ([]Challenge, error) {
	rows, err := db.QueryContext(ctx, "SELECT record FROM challenges ORDER BY json_extract(record, '$.createdAt'), id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	challenges := make([]Challenge, 0)
	for rows.Next() {
		c, err := scanChallenge(rows)
		if err != nil {
			return nil, err
		}
		challenges = append(challenges, c)
	}
	return challenges, rows.Err()
}

type scanner interface{ Scan(...any) error }

func scanChallenge(row scanner) (Challenge, error) {
	var data []byte
	if err := row.Scan(&data); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Challenge{}, ErrNotFound
		}
		return Challenge{}, err
	}
	var c Challenge
	err := json.Unmarshal(data, &c)
	return c, err
}

func (s *Store) Create(ctx context.Context, fields Fields) (Challenge, error) {
	c, err := newChallenge(fields, s.currentTime())
	if err != nil {
		return Challenge{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return c, save(ctx, s.db, c)
}

func newChallenge(fields Fields, now time.Time) (Challenge, error) {
	if err := validateFields(&fields); err != nil {
		return Challenge{}, err
	}
	return Challenge{ID: uuid(), Fields: fields, Status: "backlog", CreatedAt: now, UpdatedAt: now,
		Log: []Entry{}, Attachments: []Attachment{}}, nil
}

type executor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func save(ctx context.Context, db executor, c Challenge) error {
	data, err := json.Marshal(c)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `INSERT INTO challenges(id, record) VALUES (?, ?)
		ON CONFLICT(id) DO UPDATE SET record=excluded.record`, c.ID, string(data))
	return err
}

// Mutations read fresh state inside an immediate SQLite transaction. This
// prevents stale tabs and repeated submissions from folding a session twice.
func (s *Store) change(ctx context.Context, id string, apply func(*Challenge) error) (Challenge, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Challenge{}, err
	}
	defer tx.Rollback()
	c, err := scanChallenge(tx.QueryRowContext(ctx, "SELECT record FROM challenges WHERE id=?", id))
	if err != nil {
		return Challenge{}, err
	}
	if err := apply(&c); err != nil {
		return Challenge{}, err
	}
	if err := save(ctx, tx, c); err != nil {
		return Challenge{}, err
	}
	return c, tx.Commit()
}

func (s *Store) Delete(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	c, err := scanChallenge(tx.QueryRowContext(ctx, "SELECT record FROM challenges WHERE id=?", id))
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM challenges WHERE id=?", id); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	s.cleanup(ctx, attachmentKeys([]Challenge{c}))
	return nil
}

func cleanText(text **string, limit int) error {
	if *text == nil {
		return nil
	}
	if utf8.RuneCountInString(**text) > limit {
		return InputError(fmt.Sprintf("Максимальная длина — %d символов.", limit))
	}
	clean := strings.TrimSpace(**text)
	if clean == "" {
		*text = nil
	} else {
		*text = &clean
	}
	return nil
}

func validateFields(f *Fields) error {
	f.Title = strings.TrimSpace(f.Title)
	if f.Title == "" {
		return InputError("Введите название.")
	}
	if utf8.RuneCountInString(f.Title) > 300 {
		return InputError("Максимальная длина названия — 300 символов.")
	}
	if err := cleanText(&f.Description, 20_000); err != nil {
		return err
	}
	if err := cleanText(&f.Spark, 20_000); err != nil {
		return err
	}
	if err := cleanText(&f.Category, 60); err != nil {
		return err
	}
	if err := validMinutes(f.EstimatedDuration); err != nil {
		return err
	}
	if len(f.Tags) > 50 {
		return InputError("Можно добавить не больше 50 тегов.")
	}
	f.Tags = normalizeTags(f.Tags)
	return nil
}

func validMinutes(minutes *int) error {
	if minutes != nil && (*minutes < 0 || *minutes > 1_000_000) {
		return InputError("Не удалось распознать время.")
	}
	return nil
}

func normalizeTags(tags []string) []string {
	out := make([]string, 0, len(tags))
	seen := make(map[string]bool)
	for _, raw := range tags {
		tag := strings.Join(strings.Fields(strings.TrimLeft(strings.TrimSpace(raw), "#")), "-")
		tag = limitText(tag, 40)
		key := strings.ToLower(tag)
		if tag != "" && !seen[key] {
			out = append(out, tag)
			seen[key] = true
		}
	}
	return out
}

func limitText(value string, max int) string {
	for i := range value {
		if max == 0 {
			return value[:i]
		}
		max--
	}
	return value
}

func usableURL(raw string) bool {
	address, err := url.Parse(raw)
	return err == nil && (address.Scheme == "https" || address.Scheme == "http") && address.Hostname() != ""
}

var storageKeyPattern = regexp.MustCompile(`^[a-zA-Z0-9-]{8,64}$`)

func (s *Store) cleanup(ctx context.Context, keys []string) {
	if len(keys) == 0 {
		return
	}
	challenges, err := s.List(ctx)
	if err != nil {
		slog.Warn("skipping upload cleanup", "error", err)
		return
	}
	referenced := attachmentKeys(challenges)
	for _, key := range keys {
		if slices.Contains(referenced, key) {
			continue
		}
		if err := s.uploads.Remove(key); err != nil && !errors.Is(err, os.ErrNotExist) {
			slog.Warn("could not remove upload", "key", key, "error", err)
		}
	}
}

func attachmentKeys(challenges []Challenge) []string {
	keys := []string{}
	for _, c := range challenges {
		for _, a := range c.Attachments {
			if a.StorageKey != nil && storageKeyPattern.MatchString(*a.StorageKey) {
				keys = append(keys, *a.StorageKey)
			}
		}
	}
	return keys
}
