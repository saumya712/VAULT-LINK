// internal/middleware/logger.go

package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger returns a Gin middleware that logs every request.
// Replaces Gin's default logger with a cleaner format.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start  := time.Now()
		path   := c.Request.URL.Path
		method := c.Request.Method
		ip     := c.ClientIP()

		// c.Next() runs the actual handler
		// Everything after it runs once the handler is done
		c.Next()

		// Now we have the response status and latency
		latency := time.Since(start)
		status  := c.Writer.Status()

		// Color code the status for terminal readability
		statusColor := statusCodeColor(status)

		fmt.Printf(
			"[VAULT] %s | %s%d%s | %12v | %s | %s\n",
			time.Now().Format("2006/01/02 - 15:04:05"),
			statusColor,
			status,
			"\033[0m", // reset color
			latency,
			ip,
			method+" "+path,
		)
	}
}

// statusCodeColor returns ANSI color codes based on HTTP status
func statusCodeColor(code int) string {
	switch {
	case code >= 200 && code < 300:
		return "\033[32m" // green — success
	case code >= 300 && code < 400:
		return "\033[34m" // blue — redirect
	case code >= 400 && code < 500:
		return "\033[33m" // yellow — client error
	default:
		return "\033[31m" // red — server error
	}
}