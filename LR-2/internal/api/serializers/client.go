package serializers

import "smartdevices/internal/models"

type ClientResponse struct {
	ID          uint   `json:"id"`
	Username    string `json:"username"`
	IsModerator bool   `json:"is_moderator"`
	IsActive    bool   `json:"is_active"`
}

type ClientRegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type ClientLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func ClientToJSON(client models.Client) ClientResponse {
	return ClientResponse{
		ID:          client.ID,
		Username:    client.Username,
		IsModerator: client.IsModerator,
		IsActive:    client.IsActive,
	}
}
