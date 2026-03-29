# 🔐 VaultLink

> **Share secrets that self-destruct after one read.**
> AES-256-GCM encrypted · Zero-knowledge architecture · Atomic one-read guarantee

---

## What is VaultLink?

VaultLink is a secure one-time secret sharing service. You encrypt a secret, get a shareable link, and send it to anyone. The moment they open that link — the secret is permanently deleted from the server. Not archived. Not soft-deleted. **Gone.**

Built because every existing channel (WhatsApp, Slack, email) persists your secrets forever. VaultLink gives secrets an expiry date.

---

## Demo Flow

```
1. You type: "DB_PASSWORD=Wq9#mP2@kL"
2. VaultLink encrypts it with AES-256-GCM
3. You get: https://vaultlink.app/s/aB3xQ7...mK2
4. Recipient opens the link → sees the secret once
5. You open the link again → "Secret Destroyed" 🔥
```

---

## Features

| Feature | Implementation |
|---|---|
| AES-256-GCM encryption | Key embedded in URL, never stored server-side |
| One-read guarantee | PostgreSQL `SELECT FOR UPDATE` + `DELETE` in one atomic transaction |
| Optional passphrase lock | bcrypt hashed, two-phase retrieve (Peek before delete) |
| TTL-based expiry | 1hr to 7 days, background goroutine sweeps every 5min |
| Rate limiting | Token bucket algorithm built from scratch — no external library |
| Graceful shutdown | Context cancellation, SIGINT/SIGTERM handling |
| Zero-knowledge | Server never possesses the decryption key independently |
| Docker support | Multi-stage build, ~15MB final image |

---

## Tech Stack

### Backend
- **Language** — Go 1.24
- **HTTP Framework** — Gin (`gin-gonic/gin`)
- **Database** — PostgreSQL 15
- **DB Driver** — `jmoiron/sqlx` + `lib/pq`
- **Encryption** — `crypto/aes`, `crypto/cipher` (AES-256-GCM, stdlib)
- **Password Hashing** — `golang.org/x/crypto/bcrypt`
- **Config** — `joho/godotenv`
- **CORS** — `gin-contrib/cors`

### Frontend
- **Framework** — React 18
- **Router** — React Router v6
- **Build Tool** — Vite
- **Styling** — Tailwind CSS v3
- **Font** — JetBrains Mono + Space Grotesk

### Infrastructure
- **Containerization** — Docker (multi-stage build)
- **Orchestration** — Kubernetes (minikube for local)

---

## Architecture

```
VAULT-LINK/
├── backend/
│   ├── cmd/server/main.go          # Entry point — wires all layers
│   ├── config/config.go            # Env var loading
│   ├── internal/
│   │   ├── domain/secret.go        # Core types + SecretRepository interface
│   │   ├── crypto/aes.go           # AES-256-GCM encrypt/decrypt, token generation
│   │   ├── repository/
│   │   │   ├── postgres.go         # DB connection + auto-migration
│   │   │   └── secret_repo.go      # SQL queries, atomic FetchAndDelete
│   │   ├── service/
│   │   │   └── secret_service.go   # Business logic, orchestration
│   │   ├── handler/
│   │   │   └── secret_handler.go   # Gin handlers, request/response
│   │   ├── middleware/
│   │   │   ├── rate_limiter.go     # Token bucket per IP
│   │   │   └── logger.go           # Colored request logging
│   │   └── cleanup/
│   │       └── sweeper.go          # Background TTL expiry goroutine
│   ├── migrations/
│   │   └── 001_create_secrets.sql
│   ├── Dockerfile
│   ├── .env.example
│   └── go.mod
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── CreatePage.jsx      # Secret creation form + success state
    │   │   ├── ViewPage.jsx        # 7-state machine for viewing secrets
    │   │   └── NotFoundPage.jsx
    │   ├── components/
    │   │   ├── Layout.jsx          # Nav, footer, scanline effects
    │   │   ├── Icons.jsx           # SVG icon library
    │   │   ├── CopyButton.jsx
    │   │   └── Spinner.jsx
    │   └── utils/api.js            # Backend API calls + error classes
    ├── vite.config.js              # Dev proxy: /api → localhost:8080
    └── tailwind.config.js
```

### Layer Dependency Rule

```
Handler → Service → Repository → Domain
                 ↘ Crypto    ↗
```

Each layer only imports from the layer below it. Domain has zero internal imports. Swap PostgreSQL for Redis tomorrow — only Repository changes.

---

## How the Encryption Works

```
crypto/rand → 32 random bytes
    │
    ├──► base64url encode ──────────► rawToken  (goes in URL, never stored)
    │
    ├──► SHA-256(bytes) ────────────► tokenHash (DB primary key — one-way, irreversible)
    │
    └──► SHA-256(bytes + "enc") ───► AES key   (derived on demand, never stored)

Encryption:
  nonce (12 random bytes) + AES-GCM-Encrypt(key, plaintext) + auth tag (16 bytes)
  → stored as single BYTEA blob in PostgreSQL

Decryption:
  rawToken from URL → derive key → split blob → verify auth tag → decrypt
```

A stolen database reveals nothing. No key, no plaintext.

---

## The Atomic One-Read Guarantee

```sql
BEGIN;
SELECT * FROM secrets WHERE id = $1 FOR UPDATE;  -- locks the row
DELETE FROM secrets WHERE id = $1;               -- deletes it
COMMIT;                                           -- lock released, row gone
```

Two simultaneous requests for the same secret: one wins, one gets 404. Race condition impossible.

---

## API Reference

### POST `/api/secrets`
Create a new secret.

**Request:**
```json
{
  "content": "my secret value",
  "ttl_hours": 24,
  "passphrase": "optional"
}
```

**Response `201`:**
```json
{
  "url": "http://localhost:5173/s/<token>",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

---

### GET `/api/secrets/:token`
Retrieve and permanently delete a secret.

**Query params:** `?passphrase=optional`

| Status | Meaning |
|---|---|
| `200` | Secret returned and deleted |
| `401` | Wrong passphrase |
| `404` | Secret not found or already accessed |
| `423` | Passphrase required |
| `429` | Rate limited |
| `500` | Server error |

**Response `200`:**
```json
{
  "content": "my secret value",
  "requires_passphrase": false
}
```

---

## Local Development

### Prerequisites
- Go 1.24+
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Setup

**1. Clone and setup:**
```bash
git clone https://github.com/yourusername/vaultlink
cd vaultlink
```

**2. Backend:**
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL in .env

go mod tidy
go run cmd/server/main.go
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. Open:** `http://localhost:5173`

### Environment Variables

```bash
# backend/.env
DATABASE_URL=postgres://postgres:password@localhost:5432/vaultlink?sslmode=disable
PORT=:8080
APP_URL=http://localhost:5173
ENV=development
```

---

## Docker

### Build the backend image:
```bash
cd backend
docker build -t vaultlink-backend:v1 .
```

### Run with Docker Compose:
```bash
docker-compose up --build
```

This starts three containers: PostgreSQL, backend (Go), frontend (React/Nginx).

### Image sizes:
```
golang:1.24-alpine (builder)  →  ~300MB (discarded after build)
alpine:latest (final)         →  ~15MB  (this is what runs)
```

Multi-stage build keeps the final image lean — no Go compiler, no source code, just the binary.

---

## Database Schema

```sql
CREATE TABLE secrets (
    id              CHAR(64)     PRIMARY KEY,   -- SHA-256 hash of token
    ciphertext      BYTEA        NOT NULL,       -- AES-256-GCM encrypted blob
    passphrase_hash TEXT         NOT NULL DEFAULT '',
    expires_at      TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_secrets_expires_at ON secrets(expires_at);
```

The index makes `DELETE WHERE expires_at < NOW()` O(log n) instead of O(n).

---

## Rate Limiting

Token bucket algorithm — implemented from scratch using `sync.RWMutex`.

```
POST /api/secrets  →  10 burst,  1 req/sec sustained per IP
GET  /api/secrets  →  20 burst,  3 req/sec sustained per IP
```

Two separate limiters so a spike in reads doesn't affect write limits. Stale IP buckets cleaned every 5 minutes by a background goroutine.

---

## Frontend State Machine

The view page manages 7 distinct states:

```
loading → confirming → revealing → burned
       ↘ requires_pass → confirming
                       ↘ pass_error
```

No boolean flags. One `state` string. Impossible to be in two states simultaneously.

---

## Security Properties

- **Zero-knowledge** — decryption key only exists in the URL, never on server
- **Atomic deletion** — `SELECT FOR UPDATE` prevents double-reads under concurrency  
- **bcrypt cost 12** — ~400ms per hash, brute force impractical
- **No plaintext logs** — server logs never contain secret content
- **Auth tag verification** — AES-GCM detects any ciphertext tampering before decryption
- **Domain separation** — `SHA-256(token + "enc")` for key derivation prevents key reuse
- **TTL enforcement** — secrets expire even if never read

---

## What I Learned Building This

The hardest problem was the passphrase flow race condition. The original implementation called `FetchAndDelete` before verifying the passphrase — meaning the secret was consumed on the first probe, before the user even submitted their passphrase. The fix was a two-phase retrieve: `Peek` (read-only, no delete) to verify the passphrase, then `FetchAndDelete` only after verification passes.

The second interesting problem was the atomic delete. Without `SELECT FOR UPDATE`, two simultaneous requests could both read the secret before either deletes it. PostgreSQL's row-level lock makes this impossible — the second request blocks until the first commits, at which point the row is already gone.

---

## Resume Bullet Points

```
• Built a zero-knowledge secret sharing service with AES-256-GCM encryption —
  decryption key embedded in URL, server never stores plaintext or key

• Implemented atomic one-read guarantee using PostgreSQL SELECT FOR UPDATE +
  DELETE in a single transaction — prevents race conditions under concurrency

• Built token bucket rate limiter from scratch using sync.RWMutex and goroutines —
  fine-grained per-IP locking with background cleanup goroutine

• Deployed with Docker multi-stage builds (300MB builder → 15MB final image)
  and Kubernetes with health checks, resource limits, and rolling updates

• Clean layered architecture: Domain → Crypto → Repository → Service → Handler
  — each layer tested in isolation, zero cross-layer imports
```

---

## Author

**Saumya Pathak** — 6th semester CS student  
Building backend systems that go beyond CRUD.

---

*VaultLink — because some messages should only be read once.*
