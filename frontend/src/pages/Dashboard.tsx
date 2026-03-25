import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>{t('nav.dashboard')}</h1>
        <p>Bienvenido de nuevo, {user?.username}.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Inventario</span>
          <span className="stat-value">--</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Incidencias Abiertas</span>
          <span className="stat-value">--</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ubicación Actual</span>
          <span className="stat-value">Taller Principal</span>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="content-placeholder">
          <h3>Resumen de actividad</h3>
          <p>Próximamente verás aquí las últimas actualizaciones de material e incidencias.</p>
        </div>
      </div>
    </div>
  );
}
