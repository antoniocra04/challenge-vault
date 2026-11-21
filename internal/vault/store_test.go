package vault

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestLegacySnapshotPreservesRunningSessionAndAttachmentVolume(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	uploads := filepath.Join(dir, "uploads")
	store, err := Open(filepath.Join(dir, "vault.sqlite"), uploads)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	input, err := os.ReadFile("testdata/legacy-export.json")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.Import(ctx, input, "migration"); err == nil {
		t.Fatal("incomplete attachment volume was accepted")
	}
	rows, err := store.List(ctx)
	if err != nil || len(rows) != 0 {
		t.Fatalf("failed migration committed: %v, %v", rows, err)
	}
	key := "b697a777-44ef-44ba-bd84-35f407c2b8b0"
	if err := os.WriteFile(filepath.Join(uploads, key), []byte("sound"), 0600); err != nil {
		t.Fatal(err)
	}
	result, err := store.Import(ctx, input, "migration")
	if err != nil || result != (ImportResult{Challenges: 1, LogEntries: 1, Attachments: 1, Files: 1}) {
		t.Fatalf("migration result = %+v, %v", result, err)
	}
	var original, migrated Snapshot
	if err := json.Unmarshal(input, &original); err != nil {
		t.Fatal(err)
	}
	output, err := store.Export(ctx, false)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(output, &migrated); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(original.Challenges, migrated.Challenges) {
		t.Fatalf("migration changed records: %s", output)
	}
	if _, err := store.Import(ctx, input, "migration"); err == nil {
		t.Fatal("strict migration accepted a nonempty destination")
	}
	got, err := store.Export(ctx, true)
	if err != nil || !strings.Contains(string(got), "c291bmQ=") {
		t.Fatalf("portable export missing bytes: %s, %v", got, err)
	}
}

func TestLifecycleBanksTimeOnceAndRetainsLog(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	s, err := Open(filepath.Join(dir, "vault.sqlite"), filepath.Join(dir, "uploads"))
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	s.now = func() time.Time { return now }
	c, err := s.Create(ctx, Fields{Title: "Радио"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Change(ctx, c.ID, "start", nil); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Change(ctx, c.ID, "start", nil); err == nil {
		t.Fatal("second start succeeded")
	}
	now = now.Add(62 * time.Second)
	if _, err := s.Change(ctx, c.ID, "return", nil); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Change(ctx, c.ID, "start", nil); err != nil {
		t.Fatal(err)
	}
	now = now.Add(60 * time.Second)
	c, err = s.Change(ctx, c.ID, "complete", []byte("{}"))
	if err != nil {
		t.Fatal(err)
	}
	if c.Status != "completed" || c.TrackedSeconds != 122 || c.SessionStartedAt != nil ||
		c.ActualDuration == nil || *c.ActualDuration != 2 || c.Log[2].Content != "Начато снова" {
		t.Fatalf("unexpected completed challenge: %+v", c)
	}
}
