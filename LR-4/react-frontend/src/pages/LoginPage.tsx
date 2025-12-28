import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { setUser } from '../store/slices/userSlice';
import api from '../api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) {
      setError('Имя пользователя обязательно');
      return false;
    }
    if (!password) {
      setError('Пароль обязателен');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.auth.loginCreate({ username, password });
      
      if (response.data.success && response.data.user) {
        // Сохраняем данные пользователя в Redux
        dispatch(setUser({
          id: response.data.user.id || 0,
          username: response.data.user.username || '',
          email: '', // Email не возвращается в ответе API
          token: '', // Токен не возвращается, так как используется сессия
          isModerator: response.data.user.is_moderator || false
        }));
        
        // Перенаправляем на главную страницу
        navigate('/');
      } else {
        setError(response.data.message || 'Ошибка авторизации');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ошибка подключения к серверу');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col xs={12} md={10} lg={8}>
          <h2 className="text-center mb-4">Вход в систему</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Имя пользователя</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            
            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </div>
          </Form>
          
          <div className="text-center mt-3">
            <p>
              Нет аккаунта? <a href="/register">Зарегистрируйтесь</a>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
