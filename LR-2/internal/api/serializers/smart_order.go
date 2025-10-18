package serializers

import (
	"smartdevices/internal/models"
	"time"
)

type SmartOrderResponse struct {
	ID            uint                     `json:"id"`
	Status        string                   `json:"status"`
	Address       string                   `json:"address"`
	TotalTraffic  float64                  `json:"total_traffic"`
	ClientID      uint                     `json:"client_id"`
	ClientName    string                   `json:"client_name"`
	FormedAt      *time.Time               `json:"formed_at,omitempty"`
	CompletedAt   *time.Time               `json:"completed_at,omitempty"`
	ModeratorID   *uint                    `json:"moderator_id,omitempty"`
	ModeratorName string                   `json:"moderator_name,omitempty"`
	CreatedAt     time.Time                `json:"created_at"`
	Items         []SmartOrderItemResponse `json:"items"`
}

type SmartOrderItemResponse struct {
	DeviceID     uint    `json:"device_id"`
	DeviceName   string  `json:"device_name"`
	Quantity     int     `json:"quantity"`
	DataPerHour  float64 `json:"data_per_hour"`
	NamespaceURL string  `json:"namespace_url"`
}

type SmartOrderUpdateRequest struct {
	Address string `json:"address"`
}

type SmartOrderFilter struct {
	Status   string    `form:"status"`
	DateFrom time.Time `form:"date_from"`
	DateTo   time.Time `form:"date_to"`
}

func SmartOrderToJSON(order models.SmartOrder, items []SmartOrderItemResponse) SmartOrderResponse {
	response := SmartOrderResponse{
		ID:           order.ID,
		Status:       order.Status,
		Address:      order.Address,
		TotalTraffic: order.TotalTraffic,
		ClientID:     order.ClientID,
		ClientName:   order.Client.Username,
		FormedAt:     order.FormedAt,
		CompletedAt:  order.CompletedAt,
		ModeratorID:  order.ModeratorID,
		CreatedAt:    order.CreatedAt,
		Items:        items,
	}

	if order.ModeratorID != nil && order.Moderator.ID != 0 {
		response.ModeratorName = order.Moderator.Username
	}

	return response
}
