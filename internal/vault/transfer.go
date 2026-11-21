package vault

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"regexp"
	"slices"
	"strings"
	"time"
)

type Snapshot struct {
	Format     string      `json:"format"`
	Version    int         `json:"version"`
	ExportedAt time.Time   `json:"exportedAt"`
	Challenges []Challenge `json:"challenges"`
}

type ImportResult struct {
	Challenges  int `json:"challenges"`
	LogEntries  int `json:"logEntries"`
	Attachments int `json:"attachments"`
	Files       int `json:"files"`
}

const exportFormat = "challenge-vault"

var idPattern = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func (s *Store) Export(ctx context.Context, includeFiles bool) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	records, err := s.List(ctx)
	if err != nil {
		return nil, err
	}
	if includeFiles {
		for i := range records {
			for j := range records[i].Attachments {
				a := &records[i].Attachments[j]
				if a.StorageKey != nil {
					data, err := s.readAttachment(*a.StorageKey)
					if err != nil {
						return nil, fmt.Errorf("read attachment %s: %w", a.ID, err)
					}
					a.Data = &data
				}
			}
		}
	}
	return json.MarshalIndent(Snapshot{exportFormat, 1, s.currentTime(), records}, "", "  ")
}

func (s *Store) readAttachment(key string) ([]byte, error) {
	f, _, err := s.openUpload(key)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(f)
}

func decodeSnapshot(data []byte, strict bool) ([]Challenge, error) {
	var envelope struct {
		Format     *string           `json:"format"`
		Version    *int              `json:"version"`
		Challenges []json.RawMessage `json:"challenges"`
	}
	badFormat := InputError("Файл не похож на экспорт Challenge Vault.")
	data = bytes.TrimSpace(data)
	if len(data) == 0 {
		return nil, badFormat
	}
	if data[0] == '[' && !strict {
		if err := json.Unmarshal(data, &envelope.Challenges); err != nil {
			return nil, badFormat
		}
	} else if err := json.Unmarshal(data, &envelope); err != nil {
		return nil, badFormat
	}
	if envelope.Version != nil && *envelope.Version > 1 {
		return nil, InputError("Файл создан более новой версией Challenge Vault.")
	}
	if envelope.Challenges == nil || (envelope.Format != nil && *envelope.Format != exportFormat) ||
		(strict && (envelope.Format == nil || envelope.Version == nil || *envelope.Version != 1)) {
		return nil, badFormat
	}
	result := make([]Challenge, 0, len(envelope.Challenges))
	for i, raw := range envelope.Challenges {
		var c Challenge
		var err error
		if strict {
			err = json.Unmarshal(raw, &c)
			if err == nil {
				err = validateMigrationShape(raw)
			}
		} else {
			err = decodePortableChallenge(raw, &c)
		}
		if err != nil {
			return nil, InputError(fmt.Sprintf("Некорректная запись %d в экспорте Challenge Vault: %v", i+1, err))
		}
		result = append(result, c)
	}
	return result, nil
}

// Manual JSON imports have historically accepted date-only strings and
// millisecond epoch numbers alongside the full timestamps used by exports.
func decodePortableChallenge(raw json.RawMessage, c *Challenge) error {
	row, err := portableDates(raw, "createdAt", "updatedAt", "startedAt", "completedAt", "abandonedAt", "sessionStartedAt")
	if err != nil {
		return err
	}
	for _, name := range []string{"log", "attachments"} {
		if value, ok := row[name]; ok {
			var children []json.RawMessage
			if err := json.Unmarshal(value, &children); err != nil {
				return err
			}
			for i, child := range children {
				fields, err := portableDates(child, "createdAt")
				if err != nil {
					return err
				}
				children[i], err = json.Marshal(fields)
				if err != nil {
					return err
				}
			}
			row[name], err = json.Marshal(children)
			if err != nil {
				return err
			}
		}
	}
	normalized, err := json.Marshal(row)
	if err != nil {
		return err
	}
	return json.Unmarshal(normalized, c)
}

func portableDates(raw json.RawMessage, names ...string) (map[string]json.RawMessage, error) {
	var row map[string]json.RawMessage
	if err := json.Unmarshal(raw, &row); err != nil {
		return nil, err
	}
	for _, name := range names {
		value, ok := row[name]
		if !ok || bytes.Equal(value, []byte("null")) {
			continue
		}
		var moment time.Time
		if err := json.Unmarshal(value, &moment); err == nil {
			continue
		}
		var stamp string
		var epoch float64
		var err error
		switch {
		case json.Unmarshal(value, &stamp) == nil:
			moment, err = time.Parse("2006-01-02", stamp)
		case json.Unmarshal(value, &epoch) == nil && math.Abs(epoch) <= 8.64e15:
			moment = time.UnixMilli(int64(epoch)).UTC()
		default:
			err = fmt.Errorf("invalid timestamp %s", name)
		}
		if err != nil {
			return nil, err
		}
		row[name], err = json.Marshal(moment)
		if err != nil {
			return nil, err
		}
	}
	return row, nil
}

var challengeKeys = strings.Fields("id title description spark category tags status favorite estimatedDuration actualDuration requiresLeavingHome requiresMoney result enjoymentScore abandonReason trackedSeconds sessionStartedAt createdAt updatedAt startedAt completedAt abandonedAt log attachments")
var logKeys = strings.Fields("id kind content createdAt")
var fileKeys = strings.Fields("id kind title url content fileName mimeType size storageKey createdAt")

func validateMigrationShape(raw json.RawMessage) error {
	row, err := requireKeys(raw, challengeKeys)
	if err != nil {
		return err
	}
	for _, nested := range []struct {
		name string
		keys []string
	}{{"log", logKeys}, {"attachments", fileKeys}} {
		var entries []json.RawMessage
		if err := json.Unmarshal(row[nested.name], &entries); err != nil || entries == nil {
			return fmt.Errorf("missing or invalid %s", nested.name)
		}
		for _, entry := range entries {
			if _, err := requireKeys(entry, nested.keys); err != nil {
				return err
			}
		}
	}
	return nil
}

func requireKeys(raw json.RawMessage, keys []string) (map[string]json.RawMessage, error) {
	var row map[string]json.RawMessage
	if err := json.Unmarshal(raw, &row); err != nil {
		return nil, err
	}
	for _, key := range keys {
		if _, ok := row[key]; !ok {
			return nil, fmt.Errorf("missing %s", key)
		}
	}
	return row, nil
}

func (s *Store) Import(ctx context.Context, data []byte, mode string) (ImportResult, error) {
	strict := mode == "migration"
	if !strict && mode != "merge" && mode != "replace" {
		return ImportResult{}, InputError("Неизвестный режим импорта.")
	}
	incoming, err := decodeSnapshot(data, strict)
	if err != nil {
		return ImportResult{}, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ImportResult{}, err
	}
	defer tx.Rollback()
	existing, err := list(ctx, tx)
	if err != nil {
		return ImportResult{}, err
	}
	if strict && len(existing) != 0 {
		return ImportResult{}, InputError("Для миграции нужна пустая база SQLite.")
	}
	now := s.currentTime()
	ids := map[string]bool{}
	for i := range incoming {
		c := &incoming[i]
		if err := prepareChallenge(c, now, strict); err != nil {
			return ImportResult{}, err
		}
		if ids[c.ID] {
			return ImportResult{}, InputError("В файле повторяется идентификатор идеи.")
		}
		ids[c.ID] = true
	}
	childIDs := &childIDSet{map[string]bool{}, map[string]bool{}}
	replaced := []Challenge{}
	for _, c := range existing {
		if mode == "replace" || ids[c.ID] {
			replaced = append(replaced, c)
		} else if err := childIDs.add(c); err != nil {
			return ImportResult{}, err
		}
	}
	for _, c := range incoming {
		if err := childIDs.add(c); err != nil {
			return ImportResult{}, err
		}
	}
	if mode == "replace" {
		if _, err := tx.ExecContext(ctx, "DELETE FROM challenges"); err != nil {
			return ImportResult{}, err
		}
	}
	result := ImportResult{Challenges: len(incoming)}
	written := []string{}
	committed := false
	defer func() {
		if !committed {
			for _, key := range written {
				_ = s.uploads.Remove(key)
			}
		}
	}()
	for _, c := range incoming {
		for i := range c.Attachments {
			a := &c.Attachments[i]
			wrote, err := s.prepareAttachment(a, strict)
			if err != nil {
				return ImportResult{}, fmt.Errorf("attachment %s: %w", a.ID, err)
			}
			if wrote {
				written = append(written, *a.StorageKey)
			}
			if a.StorageKey != nil {
				result.Files++
			}
		}
		if err := save(ctx, tx, c); err != nil {
			return ImportResult{}, err
		}
		result.LogEntries += len(c.Log)
		result.Attachments += len(c.Attachments)
	}
	if err := tx.Commit(); err != nil {
		return ImportResult{}, err
	}
	committed = true
	s.cleanup(ctx, attachmentKeys(replaced))
	return result, nil
}

type childIDSet struct {
	logs, files map[string]bool
}

func (ids *childIDSet) add(c Challenge) error {
	for _, entry := range c.Log {
		if ids.logs[entry.ID] {
			return InputError("Повторяется идентификатор записи журнала.")
		}
		ids.logs[entry.ID] = true
	}
	for _, a := range c.Attachments {
		if ids.files[a.ID] {
			return InputError("Повторяется идентификатор вложения.")
		}
		ids.files[a.ID] = true
	}
	return nil
}

func prepareChallenge(c *Challenge, now time.Time, strict bool) error {
	if strings.TrimSpace(c.Title) == "" || c.TrackedSeconds < 0 ||
		(c.EnjoymentScore != nil && (*c.EnjoymentScore < 1 || *c.EnjoymentScore > 10)) {
		return InputError("В файле есть некорректная идея.")
	}
	if !strict {
		c.Title = strings.TrimSpace(c.Title)
		c.Tags = normalizeTags(c.Tags)
		c.ID = portableID(c.ID)
		if c.Status == "" {
			c.Status = "backlog"
		}
		if c.Status != "active" {
			c.SessionStartedAt = nil
		}
		if c.CreatedAt.IsZero() {
			c.CreatedAt = now
		}
		if c.UpdatedAt.IsZero() {
			c.UpdatedAt = c.CreatedAt
		}
		if c.Log == nil {
			c.Log = []Entry{}
		}
		if c.Attachments == nil {
			c.Attachments = []Attachment{}
		}
	}
	if !idPattern.MatchString(c.ID) || c.Tags == nil || c.CreatedAt.IsZero() || c.UpdatedAt.IsZero() ||
		(c.Status != "active" && c.SessionStartedAt != nil) ||
		!slices.Contains([]string{"backlog", "active", "completed", "abandoned"}, c.Status) {
		return InputError("В файле есть некорректная идея.")
	}
	for i := range c.Log {
		entry := &c.Log[i]
		if !strict {
			entry.ID = portableID(entry.ID)
			if entry.Kind == "" {
				entry.Kind = "note"
			}
			if entry.CreatedAt.IsZero() {
				entry.CreatedAt = c.CreatedAt
			}
		}
		if !idPattern.MatchString(entry.ID) || entry.CreatedAt.IsZero() || entry.Content == "" ||
			(entry.Kind != "note" && entry.Kind != "event") {
			return InputError("В файле есть некорректная запись журнала.")
		}
	}
	for i := range c.Attachments {
		a := &c.Attachments[i]
		if !strict {
			a.ID = portableID(a.ID)
			if a.CreatedAt.IsZero() {
				a.CreatedAt = c.CreatedAt
			}
		}
		if !idPattern.MatchString(a.ID) || a.CreatedAt.IsZero() || (a.Size != nil && *a.Size < 0) ||
			!slices.Contains([]string{"url", "text", "image", "audio", "file"}, a.Kind) {
			return InputError("В файле есть некорректное вложение.")
		}
	}
	return nil
}

func portableID(id string) string {
	if !idPattern.MatchString(id) {
		return uuid()
	}
	return strings.ToLower(id)
}

func (s *Store) prepareAttachment(a *Attachment, strict bool) (bool, error) {
	if strict {
		if a.StorageKey == nil {
			if a.Data != nil {
				return false, InputError("В файле нет ключа вложения.")
			}
			return false, nil
		}
		file, stat, err := s.openUpload(*a.StorageKey)
		if err != nil {
			return false, InputError(fmt.Sprintf("Не найден файл в томе uploads (%s).", *a.StorageKey))
		}
		defer file.Close()
		if a.Size != nil && stat.Size() != int64(*a.Size) {
			return false, InputError(fmt.Sprintf("Размер файла не совпадает (%s).", *a.StorageKey))
		}
		if a.Data != nil {
			actual, err := io.ReadAll(file)
			if err != nil {
				return false, err
			}
			if !bytes.Equal(actual, *a.Data) {
				return false, InputError(fmt.Sprintf("Содержимое файла не совпадает (%s).", *a.StorageKey))
			}
		}
		a.Data = nil
		return false, nil
	}
	if a.Data != nil {
		if a.Size != nil && len(*a.Data) != *a.Size {
			return false, InputError("Размер вложения не совпадает с данными.")
		}
		key := uuid()
		size, err := s.writeUpload(key, bytes.NewReader(*a.Data), int64(len(*a.Data)))
		if err != nil {
			return false, err
		}
		a.StorageKey, a.Size, a.Data = &key, &size, nil
		return true, nil
	}
	if a.StorageKey != nil {
		file, _, err := s.openUpload(*a.StorageKey)
		if err != nil {
			a.StorageKey = nil
		} else {
			file.Close()
		}
	}
	return false, nil
}

func (s *Store) Markdown(ctx context.Context) ([]byte, error) {
	challenges, err := s.List(ctx)
	if err != nil {
		return nil, err
	}
	var out strings.Builder
	fmt.Fprintf(&out, "# Challenge Vault\n\n_Экспорт %s_\n\n", s.now().Format("2006-01-02 15:04"))
	for _, section := range []struct{ status, title string }{
		{"active", "В работе"}, {"backlog", "Идеи"}, {"completed", "Сделано"}, {"abandoned", "Архив"},
	} {
		count := 0
		for _, c := range challenges {
			if c.Status == section.status {
				count++
			}
		}
		if count == 0 {
			continue
		}
		fmt.Fprintf(&out, "## %s (%d)\n\n", section.title, count)
		for _, c := range challenges {
			if c.Status == section.status {
				s.writeMarkdownChallenge(&out, c)
			}
		}
	}
	if len(challenges) == 0 {
		out.WriteString("_Идей нет._\n")
	}
	return []byte(out.String()), nil
}

func (s *Store) writeMarkdownChallenge(out *strings.Builder, c Challenge) {
	title := c.Title
	if c.Favorite {
		title = "⭐ " + title
	}
	fmt.Fprintf(out, "### %s\n\n", title)
	for _, f := range []struct {
		label string
		value *string
	}{{"Категория", c.Category}, {"В архиве", c.AbandonReason}} {
		if f.value != nil {
			fmt.Fprintf(out, "**%s:** %s  \n", f.label, *f.value)
		}
	}
	if len(c.Tags) != 0 {
		fmt.Fprintf(out, "**Теги:** #%s  \n", strings.Join(c.Tags, " #"))
	}
	if c.EstimatedDuration != nil {
		fmt.Fprintf(out, "**Займёт:** ~%s  \n", formatMinutes(*c.EstimatedDuration))
	}
	for _, date := range []struct {
		label string
		value *time.Time
	}{{"Добавлена", &c.CreatedAt}, {"Начата", c.StartedAt}, {"Завершена", c.CompletedAt}, {"В архиве с", c.AbandonedAt}} {
		if date.value != nil {
			fmt.Fprintf(out, "**%s:** %s  \n", date.label, date.value.Local().Format("2006-01-02"))
		}
	}
	minutes := int(math.Round(float64(c.totalSeconds(s.now())) / 60))
	if c.Status == "completed" && c.ActualDuration != nil {
		minutes = *c.ActualDuration
	}
	if minutes > 0 {
		fmt.Fprintf(out, "**Потрачено:** %s  \n", formatMinutes(minutes))
	}
	if c.EnjoymentScore != nil {
		fmt.Fprintf(out, "**Понравилось:** %d из 10  \n", *c.EnjoymentScore)
	}
	out.WriteByte('\n')
	if c.Description != nil {
		fmt.Fprintln(out, *c.Description)
		out.WriteByte('\n')
	}
	if c.Spark != nil {
		fmt.Fprintf(out, "**Почему захотелось**\n\n> %s\n\n", strings.ReplaceAll(*c.Spark, "\n", "\n> "))
	}
	if c.Result != nil {
		fmt.Fprintf(out, "**Результат**\n\n%s\n\n", *c.Result)
	}
	if len(c.Attachments) != 0 {
		out.WriteString("**Вложения**\n\n")
		for _, a := range c.Attachments {
			label := firstText(a.Title, a.FileName, a.URL)
			if label == "" {
				label = "Заметка"
			}
			switch {
			case a.URL != nil && usableURL(*a.URL):
				fmt.Fprintf(out, "- [%s](%s)\n", label, *a.URL)
			case a.Content != nil:
				fmt.Fprintf(out, "- %s\n\n> %s\n", label, strings.ReplaceAll(*a.Content, "\n", "\n> "))
			case a.MimeType != nil:
				fmt.Fprintf(out, "- %s (%s)\n", label, *a.MimeType)
			default:
				fmt.Fprintf(out, "- %s\n", label)
			}
		}
		out.WriteByte('\n')
	}
	if len(c.Log) != 0 {
		out.WriteString("**Заметки**\n\n")
		for _, e := range c.Log {
			content := strings.ReplaceAll(e.Content, "\n", "\n  ")
			if e.Kind == "event" {
				content = "_" + content + "_"
			}
			fmt.Fprintf(out, "- %s — %s\n", e.CreatedAt.Local().Format("2006-01-02 15:04"), content)
		}
		out.WriteByte('\n')
	}
}

func firstText(values ...*string) string {
	for _, value := range values {
		if value != nil && *value != "" {
			return *value
		}
	}
	return ""
}

func formatMinutes(minutes int) string {
	switch {
	case minutes < 60:
		return fmt.Sprintf("%d мин", minutes)
	case minutes%60 == 0:
		return fmt.Sprintf("%d ч", minutes/60)
	default:
		return fmt.Sprintf("%d ч %d мин", minutes/60, minutes%60)
	}
}

func (s *Store) openUpload(key string) (*os.File, os.FileInfo, error) {
	if !storageKeyPattern.MatchString(key) {
		return nil, nil, ErrAttachmentNotFound
	}
	info, err := s.uploads.Lstat(key)
	if err != nil {
		return nil, nil, err
	}
	if !info.Mode().IsRegular() {
		return nil, nil, ErrAttachmentNotFound
	}
	f, err := s.uploads.Open(key)
	return f, info, err
}
