import React from 'react';
import { Container } from 'react-bootstrap';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

function DevicesPage() {
  const breadcrumbsItems = [
    { label: 'Умные устройства', active: true }
  ];

  return (
    <Container>
      <Breadcrumbs items={breadcrumbsItems} />
      
      <h1>Каталог умных устройств</h1>
      <p className="text-muted">
        Выберите подходящие устройства для вашего умного дома
      </p>
      <div className="alert alert-info">
        Список устройств и фильтры будут добавлены на следующем этапе
      </div>
    </Container>
  );
}

export default DevicesPage;