import "dotenv/config"

// Integration tests never touch the main database: they use TEST_DATABASE_URL.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
} else {
  delete process.env.DATABASE_URL
}
process.env.UPLOAD_DIR = process.env.TEST_UPLOAD_DIR ?? "./data/test-uploads"
