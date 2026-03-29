package handler

import (
	"VAULT-LINK/internel/domain"
	"VAULT-LINK/internel/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Secrethandler struct {
	Svc *service.Secretservice
}

func Newsecrethandler(svc *service.Secretservice) *Secrethandler {
	return &Secrethandler{Svc: svc}
}

type createSecretRequest struct {
	Content    string `json:"content"    binding:"required,min=1,max=10000"`
	TTLHours   int    `json:"ttl_hours"  binding:"required,min=1,max=168"`
	Passphrase string `json:"passphrase"` // optional — no binding tag
}

type createSecretResponse struct {
	URL       string `json:"url"`
	ExpiresAt string `json:"expires_at"` // ISO 8601 string — easy to parse in JS
}

type retrieveSecretResponse struct {
	Content            string `json:"content"`
	RequiresPassphrase bool   `json:"requires_passphrase"`
}

type errorResponse struct {
	Error              string `json:"error"`
	RequiresPassphrase bool   `json:"requires_passphrase,omitempty"`
}

func (h *Secrethandler) Create(c *gin.Context) {
	var req createSecretRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(401, errorResponse{
			Error: "invalid request" + err.Error(),
		})
		return
	}

	output, err := h.Svc.Createsecret(domain.Createsecretinput{
		Content:    req.Content,
		Ttlhours:   req.TTLHours,
		Passphrase: req.Passphrase,
	})
	if err != nil {
		c.JSON(401, errorResponse{
			Error: "failed to create secret",
		})
		return
	}

	c.JSON(200, createSecretResponse{
		URL:       output.URL,
		ExpiresAt: output.Expiresat.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *Secrethandler) Retrive(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(401, errorResponse{
			Error: "token is required",
		})
		return
	}

	passphrase := c.Query("passphrase")

	output, err := h.Svc.RetrieveSecret(token, passphrase)
	if err != nil {
		if errors.Is(err, service.ErrSecretNotFound) {
			c.JSON(http.StatusNotFound, errorResponse{
				Error: "Secret not found or already accessed.",
			})
			return
		}

		if errors.Is(err, service.ErrPassphraseRequired) {
			c.JSON(http.StatusLocked, errorResponse{
				Error:              "passphrase required",
				RequiresPassphrase: true,
			})
			return
		}

		if errors.Is(err, service.ErrInvalidPassphrase) {
			c.JSON(http.StatusUnauthorized, errorResponse{
				Error: "invaid passphrase",
			})
			return
		}
	}

	if output == nil {
		c.JSON(http.StatusNotFound, errorResponse{Error: "Secret not found or already accessed."})
		return
	}

	c.JSON(http.StatusOK, retrieveSecretResponse{
		Content:            output.Content,
		RequiresPassphrase: output.Requirespassphrase,
	})

}
