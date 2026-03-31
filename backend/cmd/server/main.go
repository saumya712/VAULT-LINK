// cmd/server/main.go

package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"VAULT-LINK/internel/cleanup"
	"VAULT-LINK/internel/config"
	"VAULT-LINK/internel/handler"
	"VAULT-LINK/internel/middleware"
	"VAULT-LINK/internel/repo"
	"VAULT-LINK/internel/service"
)

func main() {
	// ── Step 1: Load config ──────────────────────────────────────────────
	// Reads all env vars in one place — crashes if required ones are missing
	cfg := config.Load()

	// ── Step 2: Connect to database ──────────────────────────────────────
	db := repo.NewPostgres(cfg.Databaseurl)
	defer db.Close() // close connection pool on shutdown

	// ── Step 3: Wire up layers bottom → top ──────────────────────────────
	// Each layer only receives what it needs — no globals
	repo := repo.Newsecretrepo(db)
	svc := service.Newsecretservice(repo, cfg.Appurl)
	handler := handler.Newsecrethandler(svc)

	// ── Step 4: Create rate limiters ─────────────────────────────────────
	// Two separate limiters — create and retrieve have different limits
	// POST: 10 burst, 1 per second sustained  — stricter, creates DB rows
	// GET:  20 burst, 3 per second sustained  — more lenient, read + delete
	createLimiter := middleware.Newratelimiter(10, 1)
	retrieveLimiter := middleware.Newratelimiter(20, 3)

	// ── Step 5: Setup Gin ─────────────────────────────────────────────────
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode) // disables debug logs in production
	}

	r := gin.New() // gin.New() instead of gin.Default() — we add our own middleware

	// ── Step 6: Global middleware ─────────────────────────────────────────
	r.Use(middleware.Logger()) // our custom logger
	r.Use(gin.Recovery())      // recovers from panics — returns 500 instead of crashing

	// CORS — allow requests from the frontend origin
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{ "http://localhost:5173","https://vault-link-4.onrender.com",},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour, // how long browser caches preflight response
	}))

	// ── Step 7: Routes ───────────────────────────────────────────────────
	api := r.Group("/api")
	{
		secrets := api.Group("/secrets")
		{
			// Each route gets its own rate limiter middleware
			secrets.POST("", createLimiter.Middleware(), handler.Create)
			secrets.GET("/:token", retrieveLimiter.Middleware(), handler.Retrive)
		}
	}

	// ── Step 8: Health check ─────────────────────────────────────────────
	// Simple endpoint for load balancers and uptime monitors
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().UTC(),
		})
	})

	// ── Step 9: Start sweeper goroutine ──────────────────────────────────
	// Context controls the sweeper's lifetime
	// When we cancel it on shutdown, the sweeper exits cleanly
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sweeper := cleanup.NewSweeper(repo, 5*time.Minute)
	go sweeper.Start(ctx)

	// ── Step 10: Start HTTP server ────────────────────────────────────────
	// We use http.Server directly instead of r.Run()
	// This gives us control over timeouts and graceful shutdown
	srv := &http.Server{
		Addr:         cfg.Portnum,
		Handler:      r,
		ReadTimeout:  10 * time.Second, // max time to read request body
		WriteTimeout: 10 * time.Second, // max time to write response
		IdleTimeout:  60 * time.Second, // max time for keep-alive connections
	}

	// Start server in a goroutine so it doesn't block
	// main goroutine will wait for shutdown signal below
	go func() {
		fmt.Printf("✓ VaultLink running on %s\n", cfg.Portnum)
		fmt.Printf("✓ Frontend origin: %s\n", cfg.Appurl)
		fmt.Printf("✓ Environment: %s\n", cfg.Env)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("FATAL: server error: %v\n", err)
			os.Exit(1)
		}
	}()

	// ── Step 11: Graceful shutdown ────────────────────────────────────────
	// Block main goroutine until we receive SIGINT (Ctrl+C) or SIGTERM
	// SIGTERM is what Docker and Kubernetes send when stopping a container
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit // blocks here until signal received

	fmt.Println("\n[SERVER] Shutdown signal received")

	// Give in-flight requests 10 seconds to complete
	// After that, force shutdown regardless
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	// Cancel the sweeper context — triggers final sweep and clean exit
	cancel()

	// Gracefully shutdown the HTTP server
	// Stops accepting new requests, waits for active ones to finish
	if err := srv.Shutdown(shutdownCtx); err != nil {
		fmt.Printf("[SERVER] Forced shutdown: %v\n", err)
	}

	fmt.Println("[SERVER] Shutdown complete")
}
