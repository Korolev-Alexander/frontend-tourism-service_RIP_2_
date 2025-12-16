import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Alert, Spinner, Card, Form, Row, Col } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserOrders, completeOrder, rejectOrder } from '../store/slices/orderSlice';
import type { RootState } from '../store/index';
import type { SmartOrder } from '../api/Api';
import OrderCard from '../components/Orders/OrderCard';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.user);
  const { userOrders, loading, error } = useAppSelector((state: RootState) => state.order);

  // Фильтры для модератора
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');

  useEffect(() => {
    // Проверяем авторизацию пользователя
    if (!user || !user.isAuthenticated) {
      navigate('/login');
      return;
    }

    // Загружаем заявки пользователя только если пользователь авторизован
    if (user.isAuthenticated) {
      // Для модератора применяем фильтры
      if (user.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined
        }));
      } else {
        dispatch(fetchUserOrders(undefined));
      }
    }
  }, [dispatch, user, navigate, statusFilter, dateFromFilter, dateToFilter]);

  // Short polling - обновление каждые 3 секунды
  useEffect(() => {
    if (!user?.isAuthenticated) return;

    const interval = setInterval(() => {
      // Для модератора применяем фильтры при обновлении
      if (user.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined
        }));
      } else {
        dispatch(fetchUserOrders(undefined));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [dispatch, user?.isAuthenticated, user?.isModerator, statusFilter, dateFromFilter, dateToFilter]);

  // Фильтрация заявок на фронтенде (по создателю для модератора)
  const filteredOrders = useMemo(() => {
    if (!userOrders) return [];

    let filtered = [...userOrders];

    // Фильтр по клиенту (только на фронтенде для модератора)
    if (user?.isModerator && clientFilter) {
      filtered = filtered.filter(order => 
        order.client_name?.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    return filtered;
  }, [userOrders, clientFilter, user?.isModerator]);

  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await dispatch(completeOrder(orderId)).unwrap();
      alert('Расчет запущен! Заявка будет автоматически одобрена через 5-10 секунд.');
      // Обновляем список заявок
      if (user?.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined
        }));
      } else {
        dispatch(fetchUserOrders(undefined));
      }
    } catch (error: any) {
      console.error('Ошибка одобрения заявки:', error);
      alert('Ошибка при одобрении заявки: ' + error);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      await dispatch(rejectOrder(orderId)).unwrap();
      // Обновляем список заявок
      if (user?.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined
        }));
      } else {
        dispatch(fetchUserOrders(undefined));
      }
    } catch (error: any) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Ошибка при отклонении заявки: ' + error);
    }
  };


  return (
    <Container className="mt-4">
      <h2 className="mb-4">{user?.isModerator ? 'Все заявки (Модератор)' : 'Мои заявки'}</h2>
      
      {/* Фильтры для модератора */}
      {user?.isModerator && (
        <Card className="mb-4">
          <Card.Body>
            <h5>Фильтры</h5>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Статус</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Все</option>
                    <option value="formed">Сформирована</option>
                    <option value="completed">Завершена</option>
                    <option value="rejected">Отклонена</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Дата от</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Дата до</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Клиент (фронтенд)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Поиск по имени"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          Ошибка: {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {!userOrders || userOrders.length === 0 ? (
            <Card>
              <Card.Body>
                <Card.Text className="text-center">
                  У вас пока нет заявок. Перейдите в каталог устройств, чтобы создать новую заявку.
                </Card.Text>
                <div className="text-center">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/devices')}
                    className="mt-2"
                  >
                    Перейти к устройствам
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div>
              {filteredOrders.map((order: SmartOrder, index: number) => (
                <OrderCard
                  key={`order-${order.id}-${index}`}
                  order={order}
                  isModerator={user?.isModerator || false}
                  onViewOrder={handleViewOrder}
                  onCompleteOrder={handleCompleteOrder}
                  onRejectOrder={handleRejectOrder}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default OrdersPage;
