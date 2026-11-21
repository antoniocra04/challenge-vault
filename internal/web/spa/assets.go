//go:build embedspa

package spa

import (
	"embed"
	"io/fs"
)

//go:embed generated
var distribution embed.FS

func Assets() fs.FS {
	result, err := fs.Sub(distribution, "generated")
	if err != nil {
		panic(err)
	}
	return result
}
