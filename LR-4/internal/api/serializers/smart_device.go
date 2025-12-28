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
	// Исправляем старые URL из БД (http://localhost:9000/ -> /img-proxy/)
	namespaceURL := device.NamespaceURL
	if len(namespaceURL) > 0 && namespaceURL[:4] == "http" {
		// Заменяем http://localhost:9000/ на /img-proxy/
		if len(namespaceURL) > 21 && namespaceURL[:21] == "http://localhost:9000" {
			namespaceURL = "/img-proxy" + namespaceURL[21:]
		}
	}

	return SmartDeviceResponse{
		ID:             device.ID,
		Name:           device.Name,
		Model:          device.Model,
		AvgDataRate:    device.AvgDataRate,
		DataPerHour:    device.DataPerHour,
		NamespaceURL:   namespaceURL,
		Description:    device.Description,
		DescriptionAll: device.DescriptionAll,
		Protocol:       device.Protocol,
		IsActive:       device.IsActive,
		CreatedAt:      device.CreatedAt,
	}
}
