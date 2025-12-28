import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import AppNavbar from './components/Layout/Navbar';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import HomePage from './pages/HomePage';
import DevicesPage from './pages/DevicesPage';
import DeviceDetailPage from './pages/DeviceDetailPage';

function App() {
  return (
    <Router>
      <AppNavbar />
      <Container fluid>
        <Container className="mt-3">
          <Breadcrumbs />
        </Container>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          {/* УБРАТЬ этот маршрут: */}
          {/* <Route path="/orders" element={<div className="mt-4"><h1>Заявки</h1><p>Страница в разработке</p></div>} /> */}
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
