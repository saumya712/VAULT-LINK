// internal/cleanup/sweeper.go

package cleanup

import (
	"context"
	"fmt"
	"time"

	"VAULT-LINK/internel/domain"
)

// Sweeper holds a reference to the repository interface
// It only needs DeleteExpired — nothing else
type Sweeper struct {
	repo     domain.Secretrepo
	interval time.Duration
}

// NewSweeper creates a sweeper with the given tick interval
// We inject the interval so it's easy to change in main.go
// e.g. 5 * time.Minute in production, 10 * time.Second in dev
func NewSweeper(repo domain.Secretrepo, interval time.Duration) *Sweeper {
	return &Sweeper{
		repo:     repo,
		interval: interval,
	}
}

// Start launches the cleanup loop — meant to be called as a goroutine
//
//	go sweeper.Start(ctx)
//
// Blocks until ctx is cancelled — which happens on graceful shutdown in main.go
func (s *Sweeper) Start(ctx context.Context) {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop() // always clean up the ticker when we exit

	fmt.Printf("[SWEEPER] Started — running every %s\n", s.interval)

	// Run once immediately on startup
	// Without this, expired secrets from before the server restarted
	// sit in the DB for up to 5 minutes before the first tick fires
	s.sweep()

	for {
		select {
		case <-ticker.C:
			// Ticker fired — time to sweep
			s.sweep()

		case <-ctx.Done():
			// Context was cancelled — server is shutting down
			// Do one final sweep before exiting so we don't leave
			// expired secrets sitting in the DB during downtime
			fmt.Println("[SWEEPER] Shutting down — running final sweep")
			s.sweep()
			fmt.Println("[SWEEPER] Done")
			return
		}
	}
}

// sweep does the actual deletion and logs the result
func (s *Sweeper) sweep() {
	count, err := s.repo.Deleteexpired()
	if err != nil {
		fmt.Printf("[SWEEPER] Error deleting expired secrets: %v\n", err)
		return
	}

	if count > 0 {
		fmt.Printf("[SWEEPER] Purged %d expired secret(s)\n", count)
	}
}
