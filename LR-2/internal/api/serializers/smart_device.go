package serializers

import (
	"smartdevices/internal/models"
	"time"
)

type SmartDeviceResponse struct {
	ID             uint      `json:"id"`
	Name           string    `json:"name"`
	Model          string    `json:"model"`
	AvgDataRate    float64   `json:"avg_data_rate"`
	DataPerHour    float64   `json:"data_per_hour"`
	NamespaceURL   string    `json:"namespace_url"`
	Description    string    `json:"description"`
	DescriptionAll string    `json:"description_all"`
	Protocol       string    `json:"protocol"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
}

type SmartDeviceCreateRequest struct {
	Name           string  `json:"name" binding:"required"`
	Model          string  `json:"model"`
	AvgDataRate    float64 `json:"avg_data_rate"`
	DataPerHour    float64 `json:"data_per_hour"`
	NamespaceURL   string  `json:"namespace_url"`
	Description    string  `json:"description"`
	DescriptionAll string  `json:"description_all"`
	Protocol       string  `json:"protocol"`
}

func SmartDeviceToJSON(device models.SmartDevice) SmartDeviceResponse {
	return SmartDeviceResponse{
		ID:             device.ID,
		Name:           device.Name,
		Model:          device.Model,
		AvgDataRate:    device.AvgDataRate,
		DataPerHour:    device.DataPerHour,
		NamespaceURL:   device.NamespaceURL,
		Description:    device.Description,
		DescriptionAll: device.DescriptionAll,
		Protocol:       device.Protocol,
		IsActive:       device.IsActive,
		CreatedAt:      device.CreatedAt,
	}
}
