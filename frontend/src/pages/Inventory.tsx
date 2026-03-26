import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Espacio {
  id: number;
  nombre: string;
}

interface Item {
  id: number;
  nombre: string;
  codigo_barras: string;
  categoria: string;
  estado: string;
  espacio: Espacio;
}

export default function Inventory() {
  const { t } = useTranslation(['inventario', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canEdit = user?.role === 'admin' || user?.role === 'tecnico';

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedEspacio, selectedCategory, selectedStatus]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (searchTerm) params.buscar = searchTerm;
      if (selectedCategory) params.categoria = selectedCategory;
      if (selectedStatus) params.estado = selectedStatus;
      
      const [itemsRes, espaciosRes] = await Promise.all([
        api.get('/items/', { params }),
        api.get('/espacios/')
      ]);
      
      console.log("Fetched Items:", itemsRes.data);
      console.log("Fetched Espacios:", espaciosRes.data);
      
      let filteredItems = itemsRes.data;
      if (selectedEspacio && itemsRes.data) {
        filteredItems = filteredItems.filter((item: Item) => item.espacio?.id === parseInt(selectedEspacio));
      }

      setItems(filteredItems);
      setEspacios(espaciosRes.data);
    } catch (err: any) {
      console.error("Error fetching inventory data", err);
      if (err.response) console.error("Error Response Data:", err.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('inventario:title')}</h1>
          <p>{t('common:nav.inventario')}</p>
        </div>
        {canEdit && (
          <button className="primary-btn">
            <span>+</span> {t('inventario:add_item')}
          </button>
        )}
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder={t('inventario:search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="filter-select"
          value={selectedEspacio}
          onChange={(e) => setSelectedEspacio(e.target.value)}
        >
          <option value="">{t('inventario:filter_space')}: {t('inventario:all')}</option>
          {espacios.map(esp => (
            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">{t('inventario:filter_category')}: {t('inventario:all')}</option>
          {['Ordenador', 'Portatil', 'Impresora', 'Monitor', 'Periferico', 'Disco_Duro', 'Cable', 'Otro'].map(cat => (
            <option key={cat} value={cat}>{t(`inventario:categories.${cat}`)}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">{t('inventario:filter_status')}: {t('inventario:all')}</option>
          {['disponible', 'en_uso', 'en_reparacion', 'de_baja', 'reservado'].map(st => (
            <option key={st} value={st}>{t(`inventario:status.${st}`)}</option>
          ))}
        </select>

        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={t('inventario:view_cards')}
          >
            🔲
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title={t('inventario:view_table')}
          >
            ☰
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <p>{t('common:loading')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="content-placeholder">
          <p>{t('inventario:no_items')}</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('inventario:table.name')}</th>
                <th>{t('inventario:table.barcode')}</th>
                <th>{t('inventario:table.space')}</th>
                <th>{t('inventario:table.category')}</th>
                <th>{t('inventario:table.status')}</th>
                <th>{t('inventario:table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => navigate(`/inventario/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <td><strong>{item.nombre}</strong></td>
                  <td><code>{item.codigo_barras}</code></td>
                  <td>{item.espacio?.nombre}</td>
                  <td>{t(`inventario:categories.${item.categoria}`)}</td>
                  <td>
                    <span className={`status-badge ${item.estado}`}>
                      {t(`inventario:status.${item.estado}`)}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" title={t('common:edit')}>✎</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card" onClick={() => navigate(`/inventario/${item.id}`)}>
              <div className="item-image">
                <span className="item-placeholder">📦</span>
              </div>
              <div className="item-status-overlay">
                <span className={`status-badge ${item.estado}`}>
                  {t(`inventario:status.${item.estado}`)}
                </span>
              </div>
              <div className="item-info">
                <div className="item-meta">
                  <span className="item-category">{t(`inventario:categories.${item.categoria}`)}</span>
                </div>
                <h3 className="item-name">{item.nombre}</h3>
                <div className="item-details">
                  <div className="detail-row">
                    <span>📍</span> {item.espacio?.nombre}
                  </div>
                  <div className="detail-row">
                    <span>🏷️</span> {item.codigo_barras}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
