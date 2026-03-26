import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import CameraCapture from '../components/CameraCapture';

interface Espacio { id: number; nombre: string; }
interface Item {
  id: number;
  nombre: string;
  codigo_barras: string;
  categoria: string;
  estado: string;
  espacio: Espacio;
}
const CATEGORIAS = ['Ordenador', 'Portatil', 'Impresora', 'Monitor', 'Periferico', 'Disco_Duro', 'Cable', 'Otro'];
const ESTADOS = ['disponible', 'en_uso', 'en_reparacion', 'de_baja', 'reservado'];

function ItemCard({ item, onClick }: { item: Item, onClick: () => void }) {
  const { t } = useTranslation(['inventario']);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.get(`/items/${item.id}/fotos`).then(res => {
      if (isMounted && res.data && res.data.length > 0) {
        const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';
        const token = localStorage.getItem('token') || '';
        setPhotoUrl(`${baseUrl}${res.data[0].url}?token=${token}`);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [item.id]);

  return (
    <div className="item-card" onClick={onClick}>
      <div className="item-image" style={photoUrl ? { padding: 0 } : undefined}>
        {photoUrl ? (
          <img src={photoUrl} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="item-placeholder">📦</span>
        )}
      </div>
      <div className="item-status-overlay">
        <span className={`status-badge ${item.estado}`}>{t(`inventario:status.${item.estado}`)}</span>
      </div>
      <div className="item-info">
        <div className="item-meta">
          <span className="item-category">{t(`inventario:categories.${item.categoria}`)}</span>
        </div>
        <h3 className="item-name">{item.nombre}</h3>
        <div className="item-details">
          <div className="detail-row"><span>📍</span> {item.espacio?.nombre || '—'}</div>
          <div className="detail-row"><span>🏷️</span> {item.codigo_barras || '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { t } = useTranslation(['inventario', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo state
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canEdit = user?.role === 'admin' || user?.role === 'tecnico';
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => { fetchData(); }, [searchTerm, selectedEspacio, selectedCategory, selectedStatus]);

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

      let filtered = itemsRes.data;
      if (selectedEspacio) {
        filtered = filtered.filter((item: Item) => item.espacio?.id === parseInt(selectedEspacio));
      }
      setItems(filtered);
      setEspacios(espaciosRes.data);
    } catch (err) {
      console.error('Error fetching inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── PHOTO HANDLERS ──────────────────────────────────────────────
  const setPhoto = (file: File) => {
    setPendingPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhoto(null);
    setPhotoPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleCameraCapture = (file: File) => {
    setPhoto(file);
    setShowCamera(false);
  };

  const handleScan = (code: string) => {
    setValue('codigo_barras', code);
    setShowScanner(false);
  };

  // ── FORM SUBMIT ─────────────────────────────────────────────────
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 1. Crear el item
      const res = await api.post('/items/', {
        ...data,
        espacio_id: data.espacio_id ? parseInt(data.espacio_id) : null
      });
      const newItemId = res.data.id;

      // 2. Si hay foto pendiente, subirla
      if (pendingPhoto && newItemId) {
        const formData = new FormData();
        formData.append('foto', pendingPhoto);
        await api.post(`/items/${newItemId}/fotos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3. Cerrar modal y refrescar
      clearPhoto();
      reset();
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error creating item', err);
      alert('Error al crear el elemento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    clearPhoto();
    reset();
    setShowModal(true);
  };

  // ── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      {/* Modals */}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {/* Header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('inventario:title')}</h1>
          <p>{t('common:nav.inventario')}</p>
        </div>
        {canEdit && (
          <button className="primary-btn" onClick={openModal}>
            <span>+</span> {t('inventario:add_item')}
          </button>
        )}
      </header>

      {/* Filters */}
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

        <select className="filter-select" value={selectedEspacio} onChange={(e) => setSelectedEspacio(e.target.value)}>
          <option value="">{t('inventario:filter_space')}: {t('inventario:all')}</option>
          {espacios.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
        </select>

        <select className="filter-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">{t('inventario:filter_category')}: {t('inventario:all')}</option>
          {CATEGORIAS.map(cat => <option key={cat} value={cat}>{t(`inventario:categories.${cat}`)}</option>)}
        </select>

        <select className="filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="">{t('inventario:filter_status')}: {t('inventario:all')}</option>
          {ESTADOS.map(st => <option key={st} value={st}>{t(`inventario:status.${st}`)}</option>)}
        </select>

        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title={t('inventario:view_cards')}>🔲</button>
          <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title={t('inventario:view_table')}>☰</button>
        </div>
      </div>

      {/* Items */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><p>{t('common:loading')}</p></div>
      ) : items.length === 0 ? (
        <div className="content-placeholder"><p>{t('inventario:no_items')}</p></div>
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
                  <td>{item.espacio?.nombre || '—'}</td>
                  <td>{t(`inventario:categories.${item.categoria}`)}</td>
                  <td><span className={`status-badge ${item.estado}`}>{t(`inventario:status.${item.estado}`)}</span></td>
                  <td><div className="action-btns"><button className="icon-btn" title={t('common:edit')} onClick={e => { e.stopPropagation(); }}>✎</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={() => navigate(`/inventario/${item.id}`)} />
          ))}
        </div>
      )}

      {/* ── CREATION MODAL ── */}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content item-create-modal">
            <div className="modal-header">
              <h2>{t('inventario:add_item')}</h2>
              <button className="close-modal" onClick={() => { setShowModal(false); clearPhoto(); }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="form-row">

                  {/* ── PHOTO SECTION ── */}
                  <div className="photo-upload-section">
                    <p className="photo-section-label">{t('inventario:form.photo_section')}</p>

                    {photoPreviewUrl ? (
                      <div className="photo-preview-wrap">
                        <img src={photoPreviewUrl} alt="preview" className="photo-preview" />
                        <div className="photo-preview-actions">
                          <button type="button" className="photo-action-btn" onClick={() => setShowCamera(true)}>
                            📷 {t('inventario:form.change_photo')}
                          </button>
                          <button type="button" className="photo-action-btn danger" onClick={clearPhoto}>
                            🗑 {t('inventario:form.remove_photo')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="photo-upload-buttons">
                        <button type="button" className="photo-upload-btn" onClick={() => setShowCamera(true)}>
                          <span className="photo-btn-icon">📷</span>
                          <span>{t('inventario:form.take_photo')}</span>
                        </button>
                        <button type="button" className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
                          <span className="photo-btn-icon">🗂</span>
                          <span>{t('inventario:form.select_file')}</span>
                        </button>
                      </div>
                    )}

                    {/* Input oculto para fichero — capture="environment" permite cámara en móvil */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* ── BARCODE ── */}
                  <div className="form-field-row">
                    <div className="form-field">
                      <label className="field-label">{t('inventario:form.barcode_label')}</label>
                      <div className="barcode-input-wrap">
                        <input
                          type="text"
                          {...register('codigo_barras')}
                          className="field-input"
                          placeholder="Ej: 1234567890"
                        />
                        <button
                          type="button"
                          className="scan-trigger-btn"
                          onClick={() => setShowScanner(true)}
                          title={t('inventario:form.scan_barcode')}
                        >
                          🔎
                        </button>
                      </div>
                    </div>
                    {/* ── NUMERO_SERIE ── */}
                    <div className="form-field">
                      <label className="field-label">Número de Serie (Opcional)</label>
                      <input
                        type="text"
                        {...register('numero_serie')}
                        className="field-input"
                        placeholder="Ej: SN-987"
                      />
                    </div>
                  </div>
                  {/* ── NAME ── */}
                  <div className="form-field">
                    <label className="field-label">{t('inventario:form.name_label')}</label>
                    <input
                      type="text"
                      {...register('nombre', { required: true })}
                      className="field-input"
                    />
                  </div>

                  {/* ── CATEGORY + STATUS (2 columns) ── */}
                  <div className="form-field-row">
                    <div className="form-field">
                      <label className="field-label">{t('inventario:form.category_label')}</label>
                      <select {...register('categoria')} className="field-select">
                        {CATEGORIAS.map(cat => (
                          <option key={cat} value={cat}>{t(`inventario:categories.${cat}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="field-label">{t('inventario:form.status_label')}</label>
                      <select {...register('estado')} className="field-select">
                        {ESTADOS.map(st => (
                          <option key={st} value={st}>{t(`inventario:status.${st}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── SPACE ── */}
                  <div className="form-field">
                    <label className="field-label">{t('inventario:form.space_label')}</label>
                    <select {...register('espacio_id')} className="field-select">
                      <option value="">{t('inventario:form.no_space')}</option>
                      {espacios.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
                    </select>
                  </div>

                  {/* ── DESCRIPTION ── */}
                  <div className="form-field">
                    <label className="field-label">{t('inventario:form.description_label')}</label>
                    <textarea
                      {...register('descripcion')}
                      rows={2}
                      className="field-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="lang-btn" onClick={() => { setShowModal(false); clearPhoto(); }}>
                  {t('common:cancel')}
                </button>
                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? '⏳' : '✅'} {t('common:create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
