import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'ca' : 'es';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="brand-logo">Eskol.</h2>
        </div>
        
        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">⊞</span> {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/inventario" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📦</span> {t('nav.inventario')}
          </NavLink>
          
          {(user?.role === 'admin' || user?.role === 'tecnico') && (
            <NavLink to="/incidencias" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">⚙</span> {t('nav.incidencias')}
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">{t('nav.admin_divider')}</div>
              <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon">👤</span> {t('nav.usuarios')}
              </NavLink>
              <NavLink to="/configuracion" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon">🛠</span> {t('nav.configuracion')}
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
           <button onClick={handleLogout} className="logout-btn">
             {t('logout')}
           </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className={`role-badge role-${user?.role}`}>{t(`roles.${user?.role}`)}</span>
          </div>
          
          <div className="navbar-actions">
            <button onClick={toggleLanguage} className="lang-toggle">
              {i18n.language === 'es' ? 'CA' : 'ES'}
            </button>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
