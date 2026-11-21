package vault

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"
)

func uuid() string {
	var bytes [16]byte
	rand.Read(bytes[:])
	bytes[6] = (bytes[6] & 15) | 64
	bytes[8] = (bytes[8] & 63) | 128
	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:])
}

type changeInput struct {
	Fields
	Outcome
	Favorite           *bool    `json:"favorite"`
	Reason             *string  `json:"reason"`
	Content            string   `json:"content"`
	Minutes            *float64 `json:"minutes"`
	Discard            bool     `json:"discard"`
	EntryID            string   `json:"entryId"`
	TitleForAttachment *string  `json:"attachmentTitle"`
	URL                string   `json:"url"`
}

var urlScheme = regexp.MustCompile(`^[a-zA-Z][a-zA-Z0-9+.-]*:`)

func (s *Store) Change(ctx context.Context, id, action string, data []byte) (Challenge, error) {
	var in changeInput
	if len(data) != 0 && json.Unmarshal(data, &in) != nil {
		return Challenge{}, InputError("Не удалось прочитать данные.")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.change(ctx, id, func(c *Challenge) error {
		return applyChange(c, action, in, s.currentTime())
	})
}

func applyChange(c *Challenge, action string, in changeInput, now time.Time) error {
	var event string
	switch action {
	case "edit":
		if err := validateFields(&in.Fields); err != nil {
			return err
		}
		c.Fields = in.Fields
		if in.Favorite != nil {
			c.Favorite = *in.Favorite
		}
	case "favorite":
		if in.Favorite == nil {
			return InputError("Не указано, добавить ли идею в избранное.")
		}
		c.Favorite = *in.Favorite
		return nil
	case "start":
		if c.Status != "backlog" {
			return InputError("Начать можно только идею из списка.")
		}
		c.Status, c.SessionStartedAt, event = "active", &now, "Начато"
		if c.StartedAt == nil {
			c.StartedAt = &now
		} else {
			event = "Начато снова"
		}
	case "return":
		if c.Status != "active" {
			return InputError("Вернуть в список можно только идею, которая в работе.")
		}
		c.endSession(now, false)
		c.Status, event = "backlog", "Возвращено в список"
	case "complete", "result":
		if action == "complete" && c.Status != "active" && c.Status != "backlog" {
			return InputError("Эту идею сейчас нельзя завершить.")
		}
		if action == "result" && c.Status != "completed" {
			return InputError("Результат можно изменить только у сделанной идеи.")
		}
		if err := validateOutcome(&in.Outcome); err != nil {
			return err
		}
		c.Outcome = in.Outcome
		if action == "complete" {
			c.endSession(now, false)
			c.Status, c.CompletedAt, event = "completed", &now, "Завершено"
			if c.StartedAt == nil {
				c.StartedAt = &now
			}
			if c.ActualDuration == nil {
				minutes := int(math.Round(float64(c.TrackedSeconds) / 60))
				c.ActualDuration = &minutes
			}
		}
	case "archive":
		if c.Status != "active" && c.Status != "backlog" {
			return InputError("Эту идею сейчас нельзя перенести в архив.")
		}
		if err := cleanText(&in.Reason, 500); err != nil {
			return err
		}
		c.endSession(now, false)
		c.Status, c.AbandonedAt, c.AbandonReason = "abandoned", &now, in.Reason
		event = "Перенесено в архив"
		if in.Reason != nil {
			event = "В архиве: " + *in.Reason
		}
	case "restore":
		if c.Status != "abandoned" && c.Status != "completed" {
			return InputError("Идея уже в списке или в работе.")
		}
		c.Status, c.AbandonedAt, c.AbandonReason, c.CompletedAt = "backlog", nil, nil, nil
		event = "Возвращено в список"
	case "pause", "resume":
		if c.Status != "active" {
			return InputError("Таймер есть только у идеи в работе.")
		}
		if action == "pause" {
			c.endSession(now, in.Discard)
		} else if c.SessionStartedAt == nil {
			c.SessionStartedAt = &now
		}
	case "time":
		if in.Minutes == nil || *in.Minutes < 0 || *in.Minutes > 1_000_000 {
			return InputError("Не удалось распознать время.")
		}
		c.TrackedSeconds = int(math.Round(*in.Minutes * 60))
		if c.SessionStartedAt != nil {
			c.SessionStartedAt = &now
		}
		if c.Status == "completed" {
			minutes := int(math.Round(*in.Minutes))
			c.ActualDuration = &minutes
		}
	case "note":
		content, err := requiredText(in.Content, 20_000)
		if err != nil {
			return err
		}
		c.Log = append(c.Log, Entry{ID: uuid(), Kind: "note", Content: content, CreatedAt: now})
	case "delete-note":
		c.Log = slices.DeleteFunc(c.Log, func(entry Entry) bool { return entry.ID == in.EntryID && entry.Kind == "note" })
		return nil
	case "attach-link", "attach-text":
		a := Attachment{ID: uuid(), Title: in.TitleForAttachment, CreatedAt: now}
		if err := cleanText(&a.Title, 300); err != nil {
			return err
		}
		if action == "attach-text" {
			content, err := requiredText(in.Content, 100_000)
			if err != nil {
				return err
			}
			a.Kind, a.Content = "text", &content
		} else {
			raw := strings.TrimSpace(in.URL)
			if raw != "" && !urlScheme.MatchString(raw) {
				raw = "https://" + raw
			}
			if len(raw) > 4000 || !usableURL(raw) {
				return InputError("Неверная ссылка.")
			}
			a.Kind, a.URL = "url", &raw
		}
		c.Attachments = append(c.Attachments, a)
	default:
		return InputError("Неизвестное действие.")
	}
	if event != "" {
		c.Log = append(c.Log, Entry{ID: uuid(), Kind: "event", Content: event, CreatedAt: now})
	}
	c.UpdatedAt = now
	return nil
}

func (c *Challenge) totalSeconds(now time.Time) int {
	if c.SessionStartedAt == nil {
		return c.TrackedSeconds
	}
	return c.TrackedSeconds + max(0, int(now.Sub(*c.SessionStartedAt)/time.Second))
}

func (c *Challenge) endSession(now time.Time, discard bool) {
	if !discard {
		c.TrackedSeconds = c.totalSeconds(now)
	}
	c.SessionStartedAt = nil
}

func requiredText(text string, limit int) (string, error) {
	clean := strings.TrimSpace(text)
	if clean == "" {
		return "", InputError("Текст пустой.")
	}
	if utf8.RuneCountInString(text) > limit {
		return "", InputError(fmt.Sprintf("Максимальная длина — %d символов.", limit))
	}
	return clean, nil
}

func validateOutcome(out *Outcome) error {
	if out.EnjoymentScore != nil && (*out.EnjoymentScore < 1 || *out.EnjoymentScore > 10) {
		return InputError("Оценка должна быть от 1 до 10.")
	}
	if err := validMinutes(out.ActualDuration); err != nil {
		return err
	}
	return cleanText(&out.Result, 20_000)
}
