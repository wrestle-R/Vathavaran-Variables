package main

import (
	"errors"
	"fmt"
	"github.com/wrestle-R/Vathavaran-Variables/Go-cli/internal/varte"
	"os"
)

func main() {
	app := varte.NewApp()
	if err := app.Run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "varte:", err)
		var exit *varte.ExitError
		if errors.As(err, &exit) {
			os.Exit(exit.Code)
		}
		os.Exit(1)
	}
}
