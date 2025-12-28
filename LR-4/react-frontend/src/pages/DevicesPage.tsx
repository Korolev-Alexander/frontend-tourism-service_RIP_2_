import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Spinner, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import type { SmartDevice } from '../types';
import type { RootState } from '../store';
import { setSearchFilter } from '../store/slices/deviceSlice';
import DeviceList from '../components/Devices/DeviceList';
import { api } from '../services/api';

const DevicesPage: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.devices);
  
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Загрузка устройств при монтировании
  useEffect(() => {
    loadDevices(filters.search);
  }, []);

  // Загрузка устройств при изменении фильтров из Redux
  useEffect(() => {
    if (filters.search !== '') {
      loadDevices(filters.search);
    }
  }, [filters.search]);

  const loadDevices = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Используем api.getDevices() вместо прямого fetch
      const devicesData = await api.getDevices({ 
        search: search && search.trim() !== '' ? search.trim() : undefined 
      });
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
    
    // Сохраняем фильтр в Redux store
    dispatch(setSearchFilter(value));

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
      <Row>
        <Col>
          <h1 className="mb-4">Умные устройства</h1>
          
          {/* Поисковая строка */}
          <div className="mb-4">
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Поиск устройств по названию..."
                value={filters.search} // Используем значение из Redux
                onChange={handleSearchChange}
                size="lg"
              />
              <Form.Text className="text-muted">
                Начните вводить название устройства - поиск запустится автоматически
                {filters.search && (
                  <span className="ms-2">
                    (фильтр сохранен в Redux: "{filters.search}")
                  </span>
                )}
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
