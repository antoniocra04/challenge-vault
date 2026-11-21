//go:build !embedspa

package spa

import "io/fs"

// The local Vite server provides the UI when assets are not built in.
func Assets() fs.FS { return nil }
