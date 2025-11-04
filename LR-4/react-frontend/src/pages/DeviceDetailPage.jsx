import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    navigate('/devices');
  };

  const breadcrumbsItems = [
    { label: 'Умные устройства', href: '/devices' },
    { label: `Устройство #${id}`, active: true }
  ];

  return (
    <Container>
      <Breadcrumbs items={breadcrumbsItems} />
      
      <Button variant="outline-primary" onClick={handleBackClick} className="mb-3">
        ← Назад к списку устройств
      </Button>
      
      <h1>Умное устройство #{id}</h1>
      <p className="text-muted">Детальная информация об устройстве</p>
      
      <div className="alert alert-info">
        Детальная страница устройства будет реализована на следующем этапе
      </div>
    </Container>
  );
}

export default DeviceDetailPage;