package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Databaseurl string
	Portnum     string
	Appurl      string
	Env         string
}

func Load() *Config {
	if err:=godotenv.Load();err!=nil{
		log.Println("ERROR LOADING THE .ENV ELEMENTS")
	}

	cfg:=&Config{
        Databaseurl: mustget("DATABASE_URL"),
		Portnum: getordefault("PORT",":8080"),
		Appurl: getordefault("APP_URL","http://localhost:5173"),
		Env: getordefault("ENV","development"),
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
