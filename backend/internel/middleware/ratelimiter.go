package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type bucket struct {
	tokens     float64
	lastrefill time.Time
	mu         sync.Mutex
}

type Ratelimiter struct {
	buckets    map[string]*bucket
	mu         sync.RWMutex
	maxtokens  float64
	refillrate float64
}

func Newratelimiter(maxtokens,refillrate float64) *Ratelimiter{
	r1:=&Ratelimiter{
		buckets: make(map[string]*bucket),
		maxtokens: maxtokens,
		refillrate: refillrate,
	}

	go r1.cleanuploop()

	return r1
}


func (r1 *Ratelimiter) cleanuploop(){
	ticker:=time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C{
		r1.mu.Lock()
		for ip,b:=range r1.buckets{
			b.mu.Lock()
			if time.Since(b.lastrefill) > 10*time.Minute {
                delete(r1.buckets,ip)
			}
			b.mu.Unlock()
		}
		r1.mu.Unlock()
	}
}

func (r1 *Ratelimiter) Middleware() gin.HandlerFunc{
	return func(ctx *gin.Context) {
		ip:=ctx.ClientIP()

		if !r1.allow(ip) {
			ctx.JSON(429,gin.H{
				"message":"too many requests",
			})
			ctx.Abort()
			return 
		}
		ctx.Next()
	}
}

func (r1 *Ratelimiter) allow(ip string) bool{
	r1.mu.RLock()
	b,exists:=r1.buckets[ip]
	r1.mu.RUnlock()

	if !exists{

		b = &bucket{
			tokens: r1.maxtokens,
			lastrefill: time.Now(),
		}
		r1.mu.Lock()
		r1.buckets[ip]=b
		r1.mu.Unlock()
	}
    b.mu.Lock()
	defer b.mu.Unlock()

	now:=time.Now()
	elapsed:=now.Sub(b.lastrefill).Seconds()
	b.tokens+=elapsed*r1.refillrate

	if b.tokens>r1.maxtokens{
		b.tokens=r1.maxtokens
	}
	b.lastrefill=now

	if b.tokens<1{
		return false
	}

	b.tokens--
	return true
}
