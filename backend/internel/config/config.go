package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Databaseurl string
	Appurl      string
	Env         string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("WARN: .env file not found; relying on environment variables")
	}

	env := getordefault("ENV", "development")

	// In production we rely on Railway environment variables; do not default to localhost.
	appURLDefault := ""
	if env != "production" {
		appURLDefault = "http://localhost:5173"
	}

	cfg:=&Config{
        Databaseurl: mustget("DATABASE_URL"),
		Appurl: getordefault("APP_URL", appURLDefault),
		Env: env,
	}
	return cfg
}

func mustget(key string) string{
	val:=os.Getenv(key)
	if val=="" {
		log.Fatalf("FATAL:DB URL NOT DRFINRD IN THE SET")
	}
	return val
}

func getordefault(key, defaulter string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaulter   // ✅ correct
	}
	return val           // ✅ correct
}
