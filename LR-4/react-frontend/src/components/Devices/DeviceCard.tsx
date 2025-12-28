import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';
import type { SmartDevice } from '../../types';
import { getBaseImgUrl } from '../../services/api';

interface DeviceCardProps {
  device: SmartDevice;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const getDefaultImage = () => {
    return '/default-device.png';
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return getDefaultImage();
    // Если URL уже полный (начинается с http), используем его как есть
    if (url.startsWith('http')) return url;
    // Иначе добавляем префикс из getBaseImgUrl()
    return `${getBaseImgUrl()}${url}`;
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'Wi-Fi': return 'primary';
      case 'Bluetooth': return 'info';
      case 'Zigbee': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-100 device-card" style={{ minHeight: '350px' }}>
      <div className="image-container" style={{ 
        height: '200px', 
        overflow: 'hidden',
        background: '#f8f9fa'
      }}>
        <Card.Img 
          variant="top" 
          src={getImageUrl(device.namespace_url)}
          alt={device.name}
          style={{ 
            height: '100%', 
            objectFit: 'cover',
            padding: '1rem'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getDefaultImage();
          }}
        />
      </div>
      
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h5">{device.name}</Card.Title>
          <Badge bg={getProtocolColor(device.protocol)}>
            {device.protocol}
          </Badge>
        </div>
        
        <Card.Text className="text-muted small mb-2">
          {device.model}
        </Card.Text>
        
        <Card.Text className="flex-grow-1">
          {device.description}
        </Card.Text>
        
        <div className="device-specs mb-3">
          <small className="text-muted d-block">
            📊 Скорость: {device.avg_data_rate} Кбит/с
          </small>
          <small className="text-muted d-block">
            🔄 Трафик: {device.data_per_hour} Кб/ч
          </small>
        </div>
        
        <div className="d-grid gap-2">
          <Link to={`/devices/${device.id}`}>
            <Button variant="outline-primary" size="sm" className="w-100">
              Подробнее
            </Button>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DeviceCard;
