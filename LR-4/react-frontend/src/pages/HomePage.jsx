import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

function HomePage() {
  const breadcrumbsItems = [
    { label: 'Главная', active: true }
  ];

  return (
    <Container>
      <Breadcrumbs items={breadcrumbsItems} />
      
      <div className="bg-light p-5 rounded mb-4">
        <h1 className="display-4">Добро пожаловать в систему Умный Дом</h1>
        <p className="lead">
          Современное решение для автоматизации вашего дома с помощью умных устройств
        </p>
      </div>

      <Row>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Умные устройства</Card.Title>
              <Card.Text>
                Широкий выбор умных устройств для автоматизации освещения, безопасности 
                и управления домашними приборами.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Простая установка</Card.Title>
              <Card.Text>
                Все устройства легко устанавливаются и настраиваются через 
                мобильное приложение.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Экономия энергии</Card.Title>
              <Card.Text>
                Оптимизируйте потребление энергии с помощью умного управления 
                устройствами.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;