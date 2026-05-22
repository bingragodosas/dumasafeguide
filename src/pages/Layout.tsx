// src/pages/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Layout.css';

// Routes that manage their own full-screen layout (no global nav/footer/padding)
const BARE_ROUTES = ['/responder/dashboard'];

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isBare = BARE_ROUTES.some(r => location.pathname.startsWith(r));

  if (isBare) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="layout-root">
      <Navbar />
      <main className={`layout-body ${isHomePage ? '' : 'layout-body--offset'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;