package models

import (
	"time"
)

// Пользователь (аналог системной таблицы Django)
type User struct {
	ID          uint   `gorm:"primaryKey"`
	Username    string `gorm:"uniqueIndex;size:150;not null"`
	Password    string `gorm:"size:128;not null"` // совместимость с Django
	IsModerator bool   `gorm:"default:false"`
	IsActive    bool   `gorm:"default:true"`
	LastLogin   *time.Time
	DateJoined  time.Time `gorm:"autoCreateTime"`
}

// Услуга (твои устройства)
type Service struct {
	ID             uint   `gorm:"primaryKey"`
	Name           string `gorm:"size:200;not null"`
	Model          string `gorm:"size:100"`
	AvgDataRate    float64
	DataPerHour    float64
	ImageURL       string `gorm:"size:500;null"` // URL из MinIO
	Description    string
	DescriptionAll string    `gorm:"type:text"`
	Protocol       string    `gorm:"size:50"`
	IsActive       bool      `gorm:"default:true"` // статус удален/действует
	CreatedAt      time.Time `gorm:"autoCreateTime"`
}

// Заявка (расширенная)
type Request struct {
	ID        uint      `gorm:"primaryKey"`
	Status    string    `gorm:"type:varchar(20);default:'draft';check:status IN ('draft','deleted','formed','completed','rejected')"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	ClientID  uint      `gorm:"not null"`
	Client    User      `gorm:"foreignKey:ClientID;constraint:OnDelete:RESTRICT"`

	// Дополнительные поля по ТЗ
	FormedAt    *time.Time // дата формирования
	CompletedAt *time.Time // дата завершения
	ModeratorID *uint      // модератор
	Moderator   User       `gorm:"foreignKey:ModeratorID;constraint:OnDelete:RESTRICT"`

	// Поля по предметной области
	Address      string  `gorm:"size:500"`
	TotalTraffic float64 // рассчитывается при завершении

	// Индекс для ограничения "одна черновая заявка на пользователя"
	// Добавим через миграцию отдельно
}

// М-М Заявки-Услуги с составным ключом
type RequestService struct {
	RequestID uint      `gorm:"primaryKey"` // часть составного ключа
	ServiceID uint      `gorm:"primaryKey"` // часть составного ключа
	Quantity  int       `gorm:"default:1;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`

	// Связи
	Request Request `gorm:"foreignKey:RequestID;constraint:OnDelete:RESTRICT"`
	Service Service `gorm:"foreignKey:ServiceID;constraint:OnDelete:RESTRICT"`
}

// Уникальный индекс для ограничения одной черновой заявки
// Добавим в миграции
