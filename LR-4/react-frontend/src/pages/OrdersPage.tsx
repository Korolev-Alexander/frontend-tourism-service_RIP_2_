import React, { useEffect } from 'react';
import { Container, Table, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadOrdersStart, loadOrdersSuccess, loadOrdersFailure } from '../store/slices/orderSlice';
import { api } from '../services/api';

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useAppSelector((state) => state.order);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Загружаем заявки пользователя
    const loadOrders = async () => {
      dispatch(loadOrdersStart());
      
      try {
        // Вызываем API для получения заявок
        const response = await api.getOrders();
        dispatch(loadOrdersSuccess(response));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки заявок';
        dispatch(loadOrdersFailure(errorMessage));
        console.error('Ошибка загрузки заявок:', err);
      }
    };

    // Проверяем, авторизован ли пользователь
    if (!user || !user.isAuthenticated) {
      navigate('/login');
      return;
    }

    loadOrders();
  }, [dispatch, user, navigate]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'formed': return 'primary';
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'formed': return 'Сформирована';
      case 'completed': return 'Завершена';
      default: return status;
    }
  };

  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <Container className="mt-4 d-flex justify-content-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Мои заявки</h3>
        </Card.Header>
        <Card.Body>
          {orders.length === 0 ? (
            <p>У вас пока нет заявок.</p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Статус</th>
                  <th>Адрес</th>
                  <th>Трафик (МБ/час)</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <Badge bg={getStatusVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </td>
                    <td>{order.address}</td>
                    <td>{order.total_traffic.toFixed(2)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        Просмотр
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrdersPage;