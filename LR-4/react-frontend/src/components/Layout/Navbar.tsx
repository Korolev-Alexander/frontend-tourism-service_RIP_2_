import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearUser } from '../../store/slices/userSlice';
import { clearOrder } from '../../store/slices/orderSlice';

// Определяем тип для состояния пользователя
interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isModerator: boolean;
  token: string | null;
}

const AppNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user) as UserState;

  const handleLogout = () => {
    // Очищаем состояние авторизации
    dispatch(clearUser());
    
    // Очищаем заявку
    dispatch(clearOrder());
    
    // Перенаправляем на главную страницу
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          🏠 Умный Дом
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
              Главная
            </Nav.Link>
            <Nav.Link as={Link} to="/devices" active={location.pathname === '/devices'}>
              Устройства
            </Nav.Link>
            {user && user.isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/orders" active={location.pathname === '/orders'}>
                  Мои заявки
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {user && user.isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/profile">
                  {user.username}
                </Nav.Link>
                <Nav.Link>
                  <Button variant="outline-light" size="sm" onClick={handleLogout}>
                    Выйти
                  </Button>
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  <Button variant="outline-light" size="sm">
                    Войти
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
