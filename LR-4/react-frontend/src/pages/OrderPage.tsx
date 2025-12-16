import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, ListGroup, Badge, Button, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserOrders, removeDeviceFromOrder, updateDeviceQuantity, submitDraftOrder } from '../store/slices/orderSlice';
import type { RootState } from '../store/index';
import type { SmartOrder, OrderItem as ApiOrderItem } from '../api/Api';

// Ключ для хранения адреса черновой заявки в localStorage
const DRAFT_ADDRESS_KEY = 'draft_order_address';

const OrderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.user);
  const orderState = useAppSelector((state: RootState) => state.order);
  
  const [address, setAddress] = useState('');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  // Если id не передан, это корзина (черновая заявка)
  const isDraft = !id;
  
  // Находим заявку по ID или берем черновик
  const order = isDraft 
    ? orderState.userOrders?.find((o: SmartOrder) => o.status === 'draft')
    : orderState.userOrders?.find((o: SmartOrder) => o.id === Number(id));

  useEffect(() => {
    // Проверяем авторизацию пользователя
    if (!user || !user.isAuthenticated) {
      navigate('/login');
      return;
    }

    // Загружаем заявки пользователя
    if (user.isAuthenticated) {
      dispatch(fetchUserOrders());
    }
  }, [dispatch, user, navigate]);

  useEffect(() => {
    // Инициализируем количества из заявки
    if (order && order.items) {
      const initialQuantities: { [key: number]: number } = {};
      order.items.forEach((item: ApiOrderItem) => {
        initialQuantities[item.device_id!] = item.quantity || 1;
      });
      setQuantities(initialQuantities);
      
      // Инициализация адреса с приоритетом: сервер > localStorage > пустая строка
      const serverAddress = order.address || '';
      const localAddress = localStorage.getItem(DRAFT_ADDRESS_KEY) || '';
      setAddress(serverAddress || localAddress);
    }
  }, [order]);

  // Обработчик изменения адреса с сохранением в localStorage
  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    // Сохраняем в localStorage только для черновых заявок
    if (isDraft) {
      localStorage.setItem(DRAFT_ADDRESS_KEY, newAddress);
    }
  };

  const handleRemoveDevice = async (deviceId: number) => {
    try {
      await dispatch(removeDeviceFromOrder(deviceId)).unwrap();
      // Перезагружаем заявки
      await dispatch(fetchUserOrders()).unwrap();
    } catch (error) {
      console.error('Ошибка при удалении устройства:', error);
    }
  };

  const handleQuantityChange = async (deviceId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setQuantities(prev => ({ ...prev, [deviceId]: newQuantity }));
    
    try {
      await dispatch(updateDeviceQuantity({ deviceId, quantity: newQuantity })).unwrap();
      // Перезагружаем заявки
      await dispatch(fetchUserOrders()).unwrap();
    } catch (error) {
      console.error('Ошибка при обновлении количества:', error);
    }
  };

  const handleSubmitOrder = async () => {
    if (!order || !order.id) {
      alert('Заявка не найдена');
      return;
    }

    if (!address.trim()) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }

    try {
      await dispatch(submitDraftOrder({ orderId: order.id, address })).unwrap();
      // Очищаем localStorage после успешного оформления заявки
      localStorage.removeItem(DRAFT_ADDRESS_KEY);
      alert('Заявка успешно оформлена!');
      navigate('/orders');
    } catch (error: any) {
      alert('Ошибка при оформлении заявки: ' + (error || 'Неизвестная ошибка'));
    }
  };

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

  if (orderState.loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
      </Container>
    );
  }

  if (orderState.error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Ошибка: {orderState.error}</Alert>
        <Button variant="primary" onClick={() => navigate(isDraft ? '/devices' : '/orders')}>
          {isDraft ? 'Вернуться к устройствам' : 'Вернуться к списку заявок'}
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          {isDraft ? 'Корзина пуста. Добавьте устройства из каталога.' : 'Заявка не найдена'}
        </Alert>
        <Button variant="primary" onClick={() => navigate(isDraft ? '/devices' : '/orders')}>
          {isDraft ? 'Перейти к устройствам' : 'Вернуться к списку заявок'}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isDraft ? 'Моя корзина (Черновик заявки)' : `Детали заявки #${order.id}`}</h2>
        <Button variant="secondary" onClick={() => navigate(isDraft ? '/devices' : '/orders')}>
          {isDraft ? 'Продолжить покупки' : 'Назад к списку'}
        </Button>
      </div>

      {!isDraft && (
        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <div>
                <h5>Информация о заявке</h5>
                <p className="mb-1">
                  <strong>Статус:</strong>{' '}
                  <Badge bg={getStatusClass(order.status || '')}>
                    {getOrderStatusText(order.status || '')}
                  </Badge>
                </p>
                <p className="mb-1">
                  <strong>Адрес:</strong> {order.address}
                </p>
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
                <p className="mb-1">
                  <strong>Трафик:</strong> {order.total_traffic?.toFixed(2)} МБ/мес
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Устройства в заявке</h5>
        </Card.Header>
        <ListGroup variant="flush">
          {order.items && order.items.length > 0 ? (
            order.items.map((item: ApiOrderItem, index: number) => (
              <ListGroup.Item key={`${order.id}-${item.device_id}-${index}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.device_name}</h6>
                    <small className="text-muted">
                      Трафик: {item.data_per_hour?.toFixed(2)} МБ/час
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {isDraft ? (
                      <>
                        <InputGroup style={{ width: '150px' }}>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.device_id!, quantities[item.device_id!] - 1)}
                            disabled={quantities[item.device_id!] <= 1}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={quantities[item.device_id!] || 1}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Разрешаем только цифры
                              if (/^\d*$/.test(inputValue)) {
                                const val = parseInt(inputValue);
                                if (!isNaN(val) && val > 0) {
                                  handleQuantityChange(item.device_id!, val);
                                } else if (inputValue === '') {
                                  // Если поле очищено, не вызываем API
                                  setQuantities(prev => ({ ...prev, [item.device_id!]: 1 }));
                                }
                              }
                            }}
                            className="text-center"
                            style={{ MozAppearance: 'textfield' }}
                          />
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.device_id!, quantities[item.device_id!] + 1)}
                          >
                            +
                          </Button>
                        </InputGroup>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveDevice(item.device_id!)}
                        >
                          Удалить
                        </Button>
                      </>
                    ) : (
                      <div>Количество: {item.quantity}</div>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item>В заявке нет устройств</ListGroup.Item>
          )}
        </ListGroup>
      </Card>

      {isDraft && order.items && order.items.length > 0 && (
        <Card>
          <Card.Body>
            <h5 className="mb-3">Оформление заявки</h5>
            <Form.Group className="mb-3">
              <Form.Label>Адрес доставки *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите адрес доставки"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-grid">
              <Button
                variant="success"
                size="lg"
                onClick={handleSubmitOrder}
                disabled={!address.trim() || orderState.loading}
              >
                {orderState.loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Оформление...
                  </>
                ) : (
                  'Оформить заявку'
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrderPage;
