import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/userSlice';
import type { RootState } from '../store/index';
import api from '../api';

const ProfilePage: React.FC = () => {
  // Получаем данные пользователя из Redux
  const user = useAppSelector((state: RootState) => state.user);
  const dispatch = useAppDispatch();
  
  // Состояния для формы
  const [username, setUsername] = useState(user.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Состояния для отображения статуса
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Загружаем актуальные данные пользователя при монтировании
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.auth.sessionList();
        if (response.data.user) {
          const userData = response.data.user;
          dispatch(setUser({
            id: userData.id || 0,
            username: userData.username || '',
            email: '', // Email не возвращается в API
            token: '', // Токен не используется, так как используется сессия
            isModerator: userData.is_moderator || false
          }));
          setUsername(userData.username || '');
        }
      } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err);
        setError('Не удалось загрузить данные пользователя');
      } finally {
        setLoading(false);
      }
    };
    
    if (user.isAuthenticated) {
      fetchUserData();
    }
  }, [user.isAuthenticated, dispatch]);
  
  // Валидация формы
  const validateForm = () => {
    if (!username.trim()) {
      setError('Имя пользователя не может быть пустым');
      return false;
    }
    
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Введите текущий пароль для изменения данных');
        return false;
      }
      
      if (newPassword !== confirmPassword) {
        setError('Новый пароль и подтверждение не совпадают');
        return false;
      }
      
      if (newPassword.length < 6) {
        setError('Новый пароль должен содержать минимум 6 символов');
        return false;
      }
    }
    
    return true;
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Подготавливаем данные для обновления
      const updateData: any = {
        id: user.id,
        username: username
      };
      
      // Добавляем текущий пароль, если он указан
      if (currentPassword) {
        updateData.current_password = currentPassword;
      }
      
      // Добавляем новый пароль, если он был изменен
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      // Выполняем запрос к API для обновления данных пользователя
      const response = await api.clients.updateUpdate(updateData);
      
      if (response.data) {
        // Обновляем данные пользователя в Redux
        dispatch(setUser({
          id: response.data.id || 0,
          username: response.data.username || '',
          email: '', // Email не возвращается в API
          token: '', // Токен не используется, так как используется сессия
          isModerator: response.data.is_moderator || false
        }));
        
        setSuccess('Данные успешно обновлены');
        // Очищаем поля паролей
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Ошибка обновления профиля:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ошибка при обновлении данных профиля');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!user.isAuthenticated) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Для доступа к профилю необходимо авторизоваться</Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="mb-4">Личный кабинет</h2>
          
          {loading && (
            <div className="text-center mb-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
            </div>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Card>
            <Card.Header>
              <h5>Информация о пользователе</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Имя пользователя</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                
                <hr />
                
                <h6>Изменение пароля</h6>
                
                <Form.Group className="mb-3" controlId="formCurrentPassword">
                  <Form.Label>Текущий пароль</Form.Label>
                  <Form.Control
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Введите текущий пароль"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="formNewPassword">
                  <Form.Label>Новый пароль</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Введите новый пароль"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="formConfirmPassword">
                  <Form.Label>Подтверждение пароля</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Подтвердите новый пароль"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
