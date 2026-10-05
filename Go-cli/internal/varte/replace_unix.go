//go:build !windows

package varte

import "os"

func replaceFile(source, destination string) error { return os.Rename(source, destination) }
