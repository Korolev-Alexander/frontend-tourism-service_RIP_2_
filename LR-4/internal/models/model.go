package models

import (
	"time"
)

// Client (table: clients) - клиенты системы
type Client struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Username    string     `gorm:"uniqueIndex;size:150;not null" json:"username"`
	Password    string     `gorm:"size:128;not null" json:"-"`
	IsModerator bool       `gorm:"default:false" json:"is_moderator"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	LastLogin   *time.Time `json:"last_login,omitempty"`
	DateJoined  time.Time  `gorm:"autoCreateTime" json:"date_joined"`
}

// SmartDevice (table: smart_devices) - умные устройства
type SmartDevice struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Name           string    `gorm:"size:200;not null" json:"name"`
	Model          string    `gorm:"size:100" json:"model"`
	AvgDataRate    float64   `json:"avg_data_rate"`
	DataPerHour    float64   `json:"data_per_hour"`
	NamespaceURL   string    `gorm:"size:500;null" json:"namespace_url"`
	Description    string    `json:"description"`
	DescriptionAll string    `gorm:"type:text" json:"description_all"`
	Protocol       string    `gorm:"size:50" json:"protocol"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// SmartOrder (table: smart_orders) - заявки на установку
type SmartOrder struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Status    string    `gorm:"type:varchar(20);default:'draft';check:status IN ('draft','deleted','formed','completed','rejected')" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	ClientID  uint      `gorm:"not null" json:"client_id"`
	Client    Client    `gorm:"foreignKey:ClientID;constraint:OnDelete:RESTRICT" json:"client"`

	FormedAt    *time.Time `json:"formed_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	ModeratorID *uint      `json:"moderator_id,omitempty"`
	Moderator   Client     `gorm:"foreignKey:ModeratorID;constraint:OnDelete:RESTRICT" json:"moderator,omitempty"`

	Address           string  `gorm:"size:500" json:"address"`
	TotalTraffic      float64 `json:"total_traffic"`
	TrafficCalculated bool    `gorm:"default:false" json:"traffic_calculated"`
}

// OrderItem (table: order_items) - устройства в заявке
type OrderItem struct {
	OrderID   uint      `gorm:"primaryKey" json:"order_id"`
	DeviceID  uint      `gorm:"primaryKey" json:"device_id"`
	Quantity  int       `gorm:"default:1;not null" json:"quantity"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Order  SmartOrder  `gorm:"foreignKey:OrderID;constraint:OnDelete:RESTRICT" json:"order"`
	Device SmartDevice `gorm:"foreignKey:DeviceID;constraint:OnDelete:RESTRICT" json:"device"`
}
