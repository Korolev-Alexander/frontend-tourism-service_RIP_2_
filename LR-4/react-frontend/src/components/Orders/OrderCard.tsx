import React from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';
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
  onRejectOrder
}) => {
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
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Заявка #{order.id}</strong>
          {isModerator && order.client_name && (
            <span className="ms-2 text-muted">
              (Клиент: {order.client_name})
            </span>
          )}
        </div>
        <Badge bg={getStatusClass(order.status || '')}>
          {getOrderStatusText(order.status || '')}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1">
              <strong>Дата создания:</strong>{' '}
              {new Date(order.created_at || '').toLocaleDateString('ru-RU')}
            </p>
            {order.formed_at && (
              <p className="mb-1">
                <strong>Дата формирования:</strong>{' '}
                {new Date(order.formed_at).toLocaleDateString('ru-RU')}
              </p>
            )}
            {order.completed_at && (
              <p className="mb-1">
                <strong>Дата завершения:</strong>{' '}
                {new Date(order.completed_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
          <div className="col-md-6">
            <p className="mb-1">
              <strong>Адрес:</strong> {order.address || 'Не указан'}
            </p>
            <p className="mb-1">
              <strong>Трафик:</strong> {order.total_traffic?.toFixed(2)} МБ/мес
            </p>
            {isModerator && order.moderator_name && (
              <p className="mb-1">
                <strong>Модератор:</strong> {order.moderator_name}
              </p>
            )}
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mt-3">
            <strong>Устройства ({order.items.length}):</strong>
            <ListGroup variant="flush" className="mt-2">
              {order.items.slice(0, 3).map((item, index) => (
                <ListGroup.Item key={index} className="px-0 py-1">
                  <small>
                    {item.device_name} × {item.quantity}
                  </small>
                </ListGroup.Item>
              ))}
              {order.items.length > 3 && (
                <ListGroup.Item className="px-0 py-1">
                  <small className="text-muted">
                    ... и еще {order.items.length - 3} устройств
                  </small>
                </ListGroup.Item>
              )}
            </ListGroup>
          </div>
        )}

        <div className="mt-3 d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onViewOrder(order.id!)}
          >
            Просмотр
          </Button>

          {isModerator && order.status === 'formed' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => onCompleteOrder?.(order.id!)}
              >
                Одобрить
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRejectOrder?.(order.id!)}
              >
                Отклонить
              </Button>
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default OrderCard;
