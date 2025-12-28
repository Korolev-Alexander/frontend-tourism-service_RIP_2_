import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Alert, Spinner, Card, Form, Row, Col } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserOrders, completeOrder, rejectOrder } from '../store/slices/orderSlice';
import type { RootState } from '../store/index';
import type { SmartOrder } from '../api/Api';
import OrderCard from '../components/Orders/OrderCard';
import { useDebounce } from '../hooks/useDebounce';
import { getTodayRU, formatDateToISO, isValidRUDate } from '../utils/dateUtils';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.user);
  const { userOrders, loading, error } = useAppSelector((state: RootState) => state.order);

  // Фильтры для модератора - даты в формате ДД.ММ.ГГГГ
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>(getTodayRU());
  const [dateToFilter, setDateToFilter] = useState<string>(getTodayRU());
  const [clientFilter, setClientFilter] = useState<string>('');

  // Debounced версии для полей дат (задержка 500мс)
  const debouncedDateFrom = useDebounce(dateFromFilter, 500);
  const debouncedDateTo = useDebounce(dateToFilter, 500);

  // Ref для отслеживания первого рендера
  const isFirstRender = useRef(true);

  // Основной useEffect для загрузки заявок с debounced фильтрами
  useEffect(() => {
    // Проверяем авторизацию пользователя
    if (!user || !user.isAuthenticated) {
      navigate('/login');
      return;
    }

    // Пропускаем первый рендер для избежания двойного запроса
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Загружаем заявки с применением фильтров
    if (user.isModerator) {
      const filters = {
        status: statusFilter || undefined,
        dateFrom: isValidRUDate(debouncedDateFrom) ? formatDateToISO(debouncedDateFrom) : undefined,
        dateTo: isValidRUDate(debouncedDateTo) ? formatDateToISO(debouncedDateTo) : undefined
      };
      console.log('[OrdersPage] 🔍 Отправка запроса с фильтрами:', filters);
      dispatch(fetchUserOrders(filters));
    } else {
      console.log('[OrdersPage] 📋 Загрузка заявок пользователя');
      dispatch(fetchUserOrders(undefined));
    }
  }, [dispatch, user, navigate, statusFilter, debouncedDateFrom, debouncedDateTo]);

  // Short polling - обновление каждые 3 секунды с актуальными фильтрами
  useEffect(() => {
    if (!user?.isAuthenticated) return;

    // Первоначальная загрузка
    if (user.isModerator) {
      const filters = {
        status: statusFilter || undefined,
        dateFrom: isValidRUDate(debouncedDateFrom) ? formatDateToISO(debouncedDateFrom) : undefined,
        dateTo: isValidRUDate(debouncedDateTo) ? formatDateToISO(debouncedDateTo) : undefined
      };
      console.log('[OrdersPage] 🚀 Первоначальная загрузка с фильтрами:', filters);
      dispatch(fetchUserOrders(filters));
    } else {
      console.log('[OrdersPage] 🚀 Первоначальная загрузка заявок пользователя');
      dispatch(fetchUserOrders(undefined));
    }

    // Устанавливаем интервал для polling
    const interval = setInterval(() => {
      if (user.isModerator) {
        const filters = {
          status: statusFilter || undefined,
          dateFrom: isValidRUDate(debouncedDateFrom) ? formatDateToISO(debouncedDateFrom) : undefined,
          dateTo: isValidRUDate(debouncedDateTo) ? formatDateToISO(debouncedDateTo) : undefined
        };
        console.log('[OrdersPage] 🔄 Polling с фильтрами:', filters);
        dispatch(fetchUserOrders(filters));
      } else {
        console.log('[OrdersPage] 🔄 Polling заявок пользователя');
        dispatch(fetchUserOrders(undefined));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [dispatch, user?.isAuthenticated, user?.isModerator, statusFilter, debouncedDateFrom, debouncedDateTo]);

  // Фильтрация заявок на фронтенде (по создателю для модератора)
  const filteredOrders = useMemo(() => {
    if (!userOrders) return [];

    console.log('[OrdersPage] 📊 Заявок с бэкенда:', userOrders.length);
    if (userOrders.length > 0) {
      console.log('[OrdersPage] 📋 Первая заявка:', {
        id: userOrders[0].id,
        status: userOrders[0].status,
        formed_at: userOrders[0].formed_at,
        client_name: userOrders[0].client_name
      });
    }

    let filtered = [...userOrders];

    // Фильтр по клиенту (только на фронтенде для модератора)
    if (user?.isModerator && clientFilter) {
      filtered = filtered.filter(order => 
        order.client_name?.toLowerCase().includes(clientFilter.toLowerCase())
      );
      console.log('[OrdersPage] ✅ После фильтра по клиенту:', filtered.length);
    }

    return filtered;
  }, [userOrders, clientFilter, user?.isModerator]);

  // Проверяем, активны ли фильтры
  const hasActiveFilters = statusFilter || dateFromFilter || dateToFilter || clientFilter;

  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await dispatch(completeOrder(orderId)).unwrap();
      alert('Расчет запущен! Заявка будет автоматически одобрена через 5-10 секунд.');
      // Обновляем список заявок с актуальными фильтрами
      if (user?.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: isValidRUDate(debouncedDateFrom) ? formatDateToISO(debouncedDateFrom) : undefined,
          dateTo: isValidRUDate(debouncedDateTo) ? formatDateToISO(debouncedDateTo) : undefined
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
      // Обновляем список заявок с актуальными фильтрами
      if (user?.isModerator) {
        dispatch(fetchUserOrders({
          status: statusFilter || undefined,
          dateFrom: isValidRUDate(debouncedDateFrom) ? formatDateToISO(debouncedDateFrom) : undefined,
          dateTo: isValidRUDate(debouncedDateTo) ? formatDateToISO(debouncedDateTo) : undefined
        }));
      } else {
        dispatch(fetchUserOrders(undefined));
      }
    } catch (error: any) {
      console.error('Ошибка отклонения заявки:', error);
      alert('Ошибка при отклонении заявки: ' + error);
    }
  };

  // Обработчик изменения даты с валидацией
  const handleDateChange = (value: string, setter: (val: string) => void) => {
    // Разрешаем только цифры и точки
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Ограничиваем длину
    if (cleaned.length <= 10) {
      setter(cleaned);
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
                  <Form.Label>Дата от (ДД.ММ.ГГГГ)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.ММ.ГГГГ"
                    value={dateFromFilter}
                    onChange={(e) => handleDateChange(e.target.value, setDateFromFilter)}
                    isInvalid={dateFromFilter !== '' && !isValidRUDate(dateFromFilter)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Неверный формат даты (ДД.ММ.ГГГГ)
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Дата до (ДД.ММ.ГГГГ)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.ММ.ГГГГ"
                    value={dateToFilter}
                    onChange={(e) => handleDateChange(e.target.value, setDateToFilter)}
                    isInvalid={dateToFilter !== '' && !isValidRUDate(dateToFilter)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Неверный формат даты (ДД.ММ.ГГГГ)
                  </Form.Control.Feedback>
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
          {filteredOrders.length === 0 ? (
            <Card>
              <Card.Body>
                <Card.Text className="text-center">
                  {hasActiveFilters ? (
                    <>Нет заявок, удовлетворяющих условиям поиска.</>
                  ) : (
                    <>У вас пока нет заявок. Перейдите в каталог устройств, чтобы создать новую заявку.</>
                  )}
                </Card.Text>
                {!hasActiveFilters && (
                  <div className="text-center">
                    <Button
                      variant="primary"
                      onClick={() => navigate('/devices')}
                      className="mt-2"
                    >
                      Перейти к устройствам
                    </Button>
                  </div>
                )}
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
