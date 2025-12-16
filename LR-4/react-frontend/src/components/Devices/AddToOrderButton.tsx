import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addDeviceToOrder, fetchDraftOrder } from '../../store/slices/orderSlice';
import type { SmartDevice } from '../../api/Api';

interface AddToOrderButtonProps {
  device: SmartDevice;
}

const AddToOrderButton: React.FC<AddToOrderButtonProps> = ({ device }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const orderState = useAppSelector((state) => state.order);
  const user = useAppSelector((state) => state.user);

  // Если пользователь модератор - не показываем кнопку
  if (user.isModerator) {
    return null;
  }

  const handleAddToOrder = async () => {
    if (!user.isAuthenticated) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      navigate('/login');
      return;
    }

    try {
      // Добавляем устройство в корзину на сервере
      await dispatch(addDeviceToOrder(device.id!)).unwrap();
      
      // Обновляем информацию о корзине
      await dispatch(fetchDraftOrder()).unwrap();
      
      // Пользователь остаётся на текущей странице для продолжения выбора товаров
    } catch (error) {
      console.error('Ошибка при добавлении устройства:', error);
    }
  };

  return (
    <Button
      variant="outline-primary"
      size="sm"
      onClick={handleAddToOrder}
      disabled={orderState.loading}
    >
      {orderState.loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
          <span className="ms-1">Добавление...</span>
        </>
      ) : (
        "Добавить в заявку"
      )}
    </Button>
  );
};

export default AddToOrderButton;
