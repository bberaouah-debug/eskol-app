import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>{t('common:nav.dashboard')}</h1>
        <p>{t('dashboard:welcome', { name: user?.username })}</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{t('dashboard:stats.inventory')}</span>
          <span className="stat-value">--</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard:stats.incidents')}</span>
          <span className="stat-value">--</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard:stats.location')}</span>
          <span className="stat-value">{t('dashboard:stats.main_workshop')}</span>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="content-placeholder">
          <h3>{t('dashboard:activity.title')}</h3>
          <p>{t('dashboard:activity.placeholder')}</p>
        </div>
      </div>
    </div>
  );
}
