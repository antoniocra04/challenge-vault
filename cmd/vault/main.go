package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"challenge-vault/internal/vault"
	"challenge-vault/internal/web"
	"challenge-vault/internal/web/spa"
)

func main() {
	if err := run(); err != nil {
		slog.Error("challenge vault", "error", err)
		os.Exit(1)
	}
}

func run() error {
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		client := http.Client{Timeout: 3 * time.Second}
		res, err := client.Get("http://127.0.0.1:" + env("PORT", "3000") + "/api/health")
		if err != nil {
			return err
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusOK {
			return fmt.Errorf("health check returned %d", res.StatusCode)
		}
		return nil
	}
	if len(os.Args) != 1 && (len(os.Args) != 3 || os.Args[1] != "migrate") {
		return errors.New("usage: vault [healthcheck | migrate vault-export.json]")
	}
	db, err := vault.Open(env("SQLITE_PATH", "./data/vault.sqlite"), env("UPLOAD_DIR", "./data/uploads"))
	if err != nil {
		return err
	}
	defer db.Close()
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if len(os.Args) != 1 {
		var input []byte
		if os.Args[2] == "-" {
			input, err = io.ReadAll(os.Stdin)
		} else {
			input, err = os.ReadFile(os.Args[2])
		}
		if err != nil {
			return err
		}
		result, err := db.Import(ctx, input, "migration")
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(result)
	}
	if os.Getenv("SEED_DEMO_DATA") == "true" {
		if err := db.Seed(ctx); err != nil {
			return err
		}
	}
	srv := &http.Server{
		Addr: ":" + env("PORT", "3000"),
		Handler: web.New(web.Options{
			Store: db, Password: os.Getenv("APP_PASSWORD"), Secure: os.Getenv("COOKIE_SECURE") == "true",
			MaxUpload: megabytes("MAX_UPLOAD_MB", 50), MaxImport: megabytes("MAX_IMPORT_MB", 256), Assets: spa.Assets(),
		}),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	done := make(chan error, 1)
	go func() {
		slog.Info("serving Vault", "address", srv.Addr)
		done <- srv.ListenAndServe()
	}()
	select {
	case err := <-done:
		return err
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdown); err != nil {
			_ = srv.Close()
			return err
		}
		if err := <-done; !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	}
}

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func megabytes(name string, fallback int64) int64 {
	value, err := strconv.ParseInt(os.Getenv(name), 10, 32)
	if err != nil || value <= 0 {
		value = fallback
	}
	return value * (1 << 20)
}
