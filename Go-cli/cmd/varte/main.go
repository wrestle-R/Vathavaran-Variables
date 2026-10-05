package main

import (
	"fmt"
	"github.com/wrestle-R/Vathavaran-Variables/Go-cli/internal/varte"
	"os"
)

func main() {
	app := varte.NewApp()
	if err := app.Run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "varte:", err)
		os.Exit(1)
	}
}
