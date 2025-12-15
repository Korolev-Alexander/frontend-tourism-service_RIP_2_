import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import type { SmartDevice } from '../api/Api';
import DeviceList from '../components/Devices/DeviceList';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchDraftOrder } from '../store/slices/orderSlice';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const order = useAppSelector((state) => state.order);
  
  // Используем счетчик из серверной корзины
  const totalItems = order.cartItemCount;
  
  const handleCartClick = () => {
    if (!user.isAuthenticated) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      navigate('/login');
    } else {
      // Если авторизован, переходим к заявке
      navigate('/order');
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Загружаем информацию о корзине, если пользователь авторизован
    if (user.isAuthenticated) {
      dispatch(fetchDraftOrder());
    }
  }, [user.isAuthenticated, dispatch]);

  const loadDevices = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (search && search.trim() !== '') {
        queryParams.append('search', search.trim());
      }

      const url = `/api/smart-devices?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to load devices');
      
      const devicesData = await response.json();
      setDevices(devicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      // Mock данные для демонстрации
      setDevices(getMockDevices());
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Устанавливаем новый таймер (задержка 800ms)
    searchTimeoutRef.current = window.setTimeout(() => {
      loadDevices(value);
    }, 800);
  };

  const getMockDevices = (): SmartDevice[] => {
    return [
      {
        id: 1,
        name: 'Умная лампочка',
        model: 'Яндекс, E27',
        avg_data_rate: 8,
        data_per_hour: 0.5,
        namespace_url: '',
        description: 'Умная лампочка Яндекс, E27',
        description_all: 'Умная Яндекс лампочка позволяет дистанционно управлять освещением',
        protocol: 'Wi-Fi',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Умная розетка', 
        model: 'YNDX-00340',
        avg_data_rate: 2,
        data_per_hour: 0.1,
        namespace_url: '',
        description: 'Умная розетка Яндекс YNDX-00340',
        description_all: 'Умная розетка для дистанционного управления электроприборами',
        protocol: 'Wi-Fi',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Датчик движения',
        model: 'Aqara Motion Sensor P1',
        avg_data_rate: 5,
        data_per_hour: 0.3,
        namespace_url: '',
        description: 'Датчик движения Aqara Motion Sensor P1',
        description_all: 'Беспроводной датчик движения для автоматизации освещения',
        protocol: 'Zigbee',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Умный выключатель',
        model: 'Яндекс, 2 клавиши',
        avg_data_rate: 3,
        data_per_hour: 0.2,
        namespace_url: '',
        description: 'Умный беспроводной выключатель Яндекс, 2 клавиши',
        description_all: 'Беспроводной выключатель для управления умным освещением',
        protocol: 'Bluetooth',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Container className="mt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="mb-0">Умные устройства</h1>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleCartClick}
            className="position-relative"
            size="lg"
          >
            <span className="fs-4">🛒</span>
            {user.isAuthenticated && totalItems > 0 && (
              <Badge 
                bg="danger" 
                pill 
                className="position-absolute top-0 start-100 translate-middle"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        </Col>
      </Row>
      
      <Row>
        <Col>
          {/* Поисковая строка */}
          <div className="mb-4">
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Поиск устройств по названию..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="lg"
              />
              <Form.Text className="text-muted">
                Начните вводить название устройства - поиск запустится автоматически
              </Form.Text>
            </Form.Group>
          </div>

          {/* Результаты */}
          {error && (
            <Alert variant="warning" className="mb-4">
              {error} (показаны демо-данные)
            </Alert>
          )}

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          ) : (
            <DeviceList devices={devices} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DevicesPage;
