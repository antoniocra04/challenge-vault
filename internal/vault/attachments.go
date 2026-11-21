package vault

import (
	"context"
	"errors"
	"io"
	"mime"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

var ErrUploadTooLarge = errors.New("Файл слишком большой.")

func (s *Store) AttachFile(ctx context.Context, id, name, mimeType, title string, data io.Reader, limit int64) (Attachment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	name = limitText(filepath.Base(name), 300)
	if name == "." || name == "" {
		name = "file"
	}
	var label *string
	if title != "" {
		title = limitText(title, 300)
		label = &title
		if err := cleanText(&label, 300); err != nil {
			return Attachment{}, err
		}
	}
	kind := "file"
	mimeType, _, _ = mime.ParseMediaType(mimeType)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		kind = "image"
	case strings.HasPrefix(mimeType, "audio/"):
		kind = "audio"
	}
	key := uuid()
	size, err := s.writeUpload(key, data, limit)
	if err != nil {
		return Attachment{}, err
	}
	if size == 0 {
		_ = s.uploads.Remove(key)
		return Attachment{}, InputError("Выберите файл.")
	}
	now := s.currentTime()
	a := Attachment{ID: uuid(), Kind: kind, Title: label, FileName: &name, MimeType: &mimeType, StorageKey: &key, Size: &size, CreatedAt: now}
	if _, err := s.change(ctx, id, func(c *Challenge) error {
		c.UpdatedAt = now
		c.Attachments = append(c.Attachments, a)
		return nil
	}); err != nil {
		_ = s.uploads.Remove(key)
		return Attachment{}, err
	}
	return a, nil
}

func (s *Store) writeUpload(key string, reader io.Reader, limit int64) (int, error) {
	f, err := s.uploads.OpenFile(key, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return 0, err
	}
	size, err := io.Copy(f, io.LimitReader(reader, limit+1))
	if err == nil && size > limit {
		err = ErrUploadTooLarge
	}
	if err == nil {
		err = f.Sync()
	}
	if err = errors.Join(err, f.Close()); err != nil {
		_ = s.uploads.Remove(key)
		return 0, err
	}
	return int(size), nil
}

func (s *Store) FindFile(ctx context.Context, id string) (Attachment, *os.File, os.FileInfo, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, a, err := s.findAttachment(ctx, id)
	if err != nil {
		return Attachment{}, nil, nil, err
	}
	if a.StorageKey == nil {
		return Attachment{}, nil, nil, ErrAttachmentNotFound
	}
	f, info, err := s.openUpload(*a.StorageKey)
	if errors.Is(err, os.ErrNotExist) {
		err = ErrAttachmentNotFound
	}
	return a, f, info, err
}

func (s *Store) DeleteAttachment(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	challengeID, a, err := s.findAttachment(ctx, id)
	if err != nil {
		return err
	}
	_, err = s.change(ctx, challengeID, func(c *Challenge) error {
		c.Attachments = slices.DeleteFunc(c.Attachments, func(a Attachment) bool { return a.ID == id })
		return nil
	})
	if err == nil && a.StorageKey != nil && storageKeyPattern.MatchString(*a.StorageKey) {
		s.cleanup(ctx, []string{*a.StorageKey})
	}
	return err
}

func (s *Store) findAttachment(ctx context.Context, id string) (string, Attachment, error) {
	challenges, err := s.List(ctx)
	if err != nil {
		return "", Attachment{}, err
	}
	for _, c := range challenges {
		for _, a := range c.Attachments {
			if a.ID == id {
				return c.ID, a, nil
			}
		}
	}
	return "", Attachment{}, ErrAttachmentNotFound
}
