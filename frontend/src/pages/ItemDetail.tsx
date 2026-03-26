import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ItemDetail() {
  const { id } = useParams();
  const { t } = useTranslation(['inventario', 'common']);
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <button className="lang-btn" onClick={() => navigate('/inventario')} style={{ marginBottom: '1rem' }}>
          ← {t('common:back')}
        </button>
        <h1>Item #{id}</h1>
        <p>Detalle del elemento (Próximamente)</p>
      </header>
      
      <div className="content-placeholder">
        <p>La vista detallada de los elementos del inventario se implementará en la siguiente fase.</p>
      </div>
    </div>
  );
}
