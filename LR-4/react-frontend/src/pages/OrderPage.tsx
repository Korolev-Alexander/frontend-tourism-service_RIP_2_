import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Card, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  updateDeviceQuantity,
  removeDeviceFromDraft,
  clearDraftOrder,
  loadOrdersStart,
  loadOrdersSuccess,
  loadOrdersFailure
} from '../store/slices/orderSlice';
import { api } from '../services/api';
import type { SmartOrder, SmartOrderItem } from '../types';

const OrderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { draftOrder, orders, loading, error } = useAppSelector((state) => state.order);
  const { user } = useAppSelector((state) => state.auth);
  
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderData, setOrderData] = useState<SmartOrder | null>(null);

  // Определяем, является ли заявка черновиком
  const isDraft = !id && draftOrder;
  const order = id ? orders.find(o => o.id === parseInt(id)) : draftOrder;

  // Загружаем данные заявки, если это не черновик
  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        dispatch(loadOrdersStart());
        try {
          const orderResponse = await api.getOrder(parseInt(id));
          setOrderData(orderResponse);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки заявки';
          dispatch(loadOrdersFailure(errorMessage));
        }
      }
    };

    loadOrder();
  }, [id, dispatch]);

  // Если заявка не найдена, перенаправляем на список заявок
  useEffect(() => {
    if (!isDraft && !order && !loading && !orderData) {
      navigate('/orders');
    }
  }, [isDraft, order, loading, orderData, navigate]);

  const handleQuantityChange = (deviceId: number, quantity: number) => {
    if (quantity < 0) return;
    dispatch(updateDeviceQuantity({ deviceId, quantity }));
  };

  const handleRemoveItem = (deviceId: number) => {
    dispatch(removeDeviceFromDraft(deviceId));
  };

  const handleSubmitOrder = async () => {
    if (!draftOrder) return;
    
    if (!address.trim()) {
      setSubmitError('Пожалуйста, укажите адрес');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Вызываем API для сохранения заявки
      const orderToSubmit = {
        ...draftOrder,
        address,
        status: 'formed'
      };
      
      await api.createOrder(orderToSubmit);
      
      // Очищаем черновик после успешной отправки
      dispatch(clearDraftOrder());
      
      // Обновляем список заявок
      try {
        const ordersResponse = await api.getOrders();
        dispatch(loadOrdersSuccess(ordersResponse));
      } catch (err) {
        console.error('Ошибка обновления списка заявок:', err);
      }
      
      // Перенаправляем на список заявок
      navigate('/orders');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при отправке заявки';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = () => {
    if (window.confirm('Вы уверены, что хотите отменить черновик?')) {
      dispatch(clearDraftOrder());
      navigate('/orders');
    }
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

  if (!isDraft && !order && !orderData) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Заявка не найдена</Alert>
      </Container>
    );
  }

  const items = order?.items || orderData?.items || [];
  const totalTraffic = items.reduce((sum, item) => sum + (item.data_per_hour * item.quantity), 0);
  const displayOrder = order || orderData;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3>
              {isDraft ? 'Черновик заявки' : `Заявка №${displayOrder?.id}`}
              {displayOrder?.status && (
                <Badge bg={
                  displayOrder.status === 'draft' ? 'secondary' :
                  displayOrder.status === 'formed' ? 'primary' :
                  displayOrder.status === 'completed' ? 'success' : 'secondary'
                } className="ms-2">
                  {displayOrder.status === 'draft' ? 'Черновик' :
                   displayOrder.status === 'formed' ? 'Сформирована' :
                   displayOrder.status === 'completed' ? 'Завершена' : displayOrder.status}
                </Badge>
              )}
            </h3>
            {isDraft && (
              <Button variant="outline-danger" size="sm" onClick={handleCancelOrder}>
                Отменить
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {isDraft && (
            <Form.Group className="mb-4">
              <Form.Label>Адрес установки</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите адрес установки устройств"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Form.Group>
          )}
          
          {items.length === 0 ? (
            <Alert variant="info">В заявке нет устройств</Alert>
          ) : (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Устройство</th>
                    <th>Количество</th>
                    <th>Трафик (МБ/час)</th>
                    {isDraft && <th>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: SmartOrderItem) => (
                    <tr key={item.device_id}>
                      <td>{item.device_name}</td>
                      <td>
                        {isDraft ? (
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.device_id, parseInt(e.target.value) || 0)}
                            style={{ width: '80px' }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td>{(item.data_per_hour * item.quantity).toFixed(2)}</td>
                      {isDraft && (
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveItem(item.device_id)}
                          >
                            Удалить
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <strong>Общий трафик:</strong> {totalTraffic.toFixed(2)} МБ/час
                </div>
                {isDraft && (
                  <div>
                    <Button
                      variant="success"
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">Отправка...</span>
                        </>
                      ) : (
                        'Подтвердить заявку'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
          
          {submitError && (
            <Alert variant="danger" className="mt-3">{submitError}</Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderPage;