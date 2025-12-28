import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import type { SmartDevice } from '../types';
import { api, getBaseImgUrl } from '../services/api';

const DeviceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<SmartDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDevice(parseInt(id));
    }
  }, [id]);

  const loadDevice = async (deviceId: number) => {
    try {
      setLoading(true);
      const deviceData = await api.getDevice(deviceId);
      setDevice(deviceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultImage = () => {
    return '/default-device.png';
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return getDefaultImage();
    
    // Если URL уже полный (начинается с http)
    if (url.startsWith('http')) {
      // Заменяем localhost на IP для Tauri
      return url.replace('http://localhost:9000', getBaseImgUrl());
    }
    
    // Иначе добавляем префикс из getBaseImgUrl()
    return `${getBaseImgUrl()}${url}`;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error || !device) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error || 'Устройство не найдено'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col lg={6}>
          <Card>
            <Card.Img 
              variant="top" 
              src={getImageUrl(device.namespace_url)}
              alt={device.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultImage();
              }}
            />
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>{device.name}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                {device.model}
              </Card.Subtitle>
              
              <div className="mb-3">
                <h5>Характеристики</h5>
                <ul className="list-unstyled">
                  <li><strong>Протокол:</strong> {device.protocol}</li>
                  <li><strong>Скорость данных:</strong> {device.avg_data_rate} Кбит/с</li>
                  <li><strong>Трафик в час:</strong> {device.data_per_hour} Кб/ч</li>
                </ul>
              </div>
              
              <div>
                <h5>Описание</h5>
                <p>{device.description_all}</p>
              </div>
              
              <div className="mt-3">
                <Button variant="primary">
                  Добавить в корзину
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DeviceDetailPage;
