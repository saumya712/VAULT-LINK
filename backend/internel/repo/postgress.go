package repo

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func Newpostgres(DBURL string) *sqlx.DB {
	db, err := sqlx.Connect("postgres", DBURL)
	if err != nil {
		log.Fatalf("FATAL: could not connect to the databse: %v", err)
	}

	fmt.Println("connented to the database")
	return db
}
