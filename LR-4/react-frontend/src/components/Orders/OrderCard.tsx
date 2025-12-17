import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import type { SmartOrder } from '../../api/Api';

interface OrderCardProps {
  order: SmartOrder;
  isModerator: boolean;
  onViewOrder: (orderId: number) => void;
  onCompleteOrder?: (orderId: number) => void;
  onRejectOrder?: (orderId: number) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isModerator,
  onViewOrder,
  onCompleteOrder,
  onRejectOrder,
}) => {
  // Отладочный вывод дат заявки
  React.useEffect(() => {
    console.log(`[OrderCard] Заявка #${order.id}:`, {
      status: order.status,
      created_at: order.created_at,
      formed_at: order.formed_at,
      completed_at: order.completed_at,
    });
  }, [order]);

  // Функция для отображения статуса заявки на русском языке
  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик';
      case 'formed':
        return 'Сформирована';
      case 'completed':
        return 'Завершена';
      case 'rejected':
        return 'Отклонена';
      case 'deleted':
        return 'Удалена';
      default:
        return status;
    }
  };

  // Функция для получения класса статуса для стилизации
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'formed':
        return 'info';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'deleted':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="mb-3 order-card">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center mb-2">
              <h5 className="mb-0 me-3">Заявка #{order.id}</h5>
              <Badge bg={getStatusClass(order.status || '')}>
                {getOrderStatusText(order.status || '')}
              </Badge>
            </div>
            
            <div className="text-muted small mb-2">
              {isModerator ? (
                <>
                  <strong>Дата формирования:</strong>{' '}
                  {order.formed_at 
                    ? new Date(order.formed_at).toLocaleDateString('ru-RU')
                    : 'Не сформирована'}
                </>
              ) : (
                <>
                  <strong>Создано:</strong> {new Date(order.created_at || '').toLocaleDateString('ru-RU')}
                </>
              )}
            </div>
            
            {isModerator && order.client_name && (
              <div className="text-muted small mb-2">
                <strong>Клиент:</strong> {order.client_name}
              </div>
            )}
            
            <div className="text-muted small mb-2">
              <strong>Адрес:</strong> {order.address || 'Не указан'}
            </div>
            
            {isModerator && (
              <div className="text-muted small">
                <strong>Трафик:</strong>{' '}
                {order.traffic_calculated ? (
                  <>
                    {order.total_traffic?.toFixed(2) || '0.00'} МБ/мес{' '}
                    <span className="badge bg-success ms-1">✓ Рассчитан</span>
                  </>
                ) : (
                  <span className="badge bg-secondary">Ожидает расчета</span>
                )}
              </div>
            )}
          </Col>
          
          <Col md={4} className="text-end">
            <div className="d-flex flex-column gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onViewOrder(order.id!)}
              >
                Просмотр
              </Button>
              
              {isModerator && order.status === 'formed' && onCompleteOrder && onRejectOrder && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onCompleteOrder(order.id!)}
                  >
                    Одобрить
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRejectOrder(order.id!)}
                  >
                    Отклонить
                  </Button>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default OrderCard;
