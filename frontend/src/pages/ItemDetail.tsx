import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';

interface Espacio { id: number; nombre: string; }
interface Item {
  id: number;
  nombre: string;
  codigo_barras: string;
  numero_serie: string;
  categoria: string;
  estado: string;
  descripcion: string;
  espacio: Espacio;
  fecha_alta: string;
}
interface Foto { id: string; url: string; filename: string; }

const CATEGORIAS = ['Ordenador', 'Portatil', 'Impresora', 'Monitor', 'Periferico', 'Disco_Duro', 'Cable', 'Otro'];
const ESTADOS = ['disponible', 'en_uso', 'en_reparacion', 'de_baja', 'reservado'];

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['inventario', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'tecnico';
  const apiBase = api.defaults.baseURL?.replace(/\/$/, '');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchItem();
    fetchFotos();
    fetchEspacios();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
    } catch {
      navigate('/inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEspacios = async () => {
    try {
      const res = await api.get('/espacios/');
      setEspacios(res.data);
    } catch (err) { }
  };

  const fetchFotos = async () => {
    try {
      const res = await api.get(`/items/${id}/fotos`);
      setFotos(res.data);
    } catch {
      // Sin fotos aún
    }
  };

  const handleCapture = async (file: File) => {
    setShowCamera(false);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      await api.post(`/items/${id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchFotos();
    } catch (err) {
      console.error('Error subiendo foto', err);
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFoto = async (fotoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    await api.delete(`/items/${id}/fotos/${fotoId}`);
    setFotos(prev => prev.filter(f => f.id !== fotoId));
  };

  const openEditModal = () => {
    reset({
      nombre: item?.nombre,
      codigo_barras: item?.codigo_barras || '',
      numero_serie: item?.numero_serie || '',
      categoria: item?.categoria,
      estado: item?.estado,
      espacio_id: item?.espacio?.id || '',
      descripcion: item?.descripcion || ''
    });
    setShowEditModal(true);
  };

  const onEditSubmit = async (data: any) => {
    try {
      setSaving(true);
      const payload = { ...data, espacio_id: data.espacio_id ? parseInt(data.espacio_id) : null };
      const res = await api.put(`/items/${id}`, payload);
      setItem(res.data);
      setShowEditModal(false);
    } catch (err) {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="page-wrapper"><p>{t('common:loading')}</p></div>;
  if (!item) return null;

  return (
    <div className="page-wrapper">
      {showCamera && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content item-create-modal">
            <h2 className="modal-title">Editar Ficha</h2>
            <form onSubmit={handleSubmit(onEditSubmit)} className="item-form">
              <div className="form-field-row">
                <div className="form-field">
                  <label className="field-label">Código de Barras</label>
                  <input type="text" {...register('codigo_barras')} className="field-input" />
                </div>
                <div className="form-field">
                  <label className="field-label">Número de Serie</label>
                  <input type="text" {...register('numero_serie')} className="field-input" />
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Nombre *</label>
                <input type="text" {...register('nombre', { required: true })} className="field-input" />
              </div>
              <div className="form-field-row">
                <div className="form-field">
                  <label className="field-label">Categoría</label>
                  <select {...register('categoria')} className="field-select">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{t(`inventario:categories.${c}`)}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="field-label">Estado</label>
                  <select {...register('estado')} className="field-select">
                    {ESTADOS.map(s => <option key={s} value={s}>{t(`inventario:status.${s}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Espacio</label>
                <select {...register('espacio_id')} className="field-select">
                  <option value="">Ninguno</option>
                  {espacios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Descripción</label>
                <textarea {...register('descripcion')} className="field-input" rows={3}></textarea>
              </div>
              <div className="modal-actions modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="page-header">
        <button className="lang-btn" onClick={() => navigate('/inventario')} style={{ marginBottom: '1rem' }}>
          ← {t('common:back')}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>{item.nombre}</h1>
          <span className={`status-badge ${item.estado}`}>
            {t(`inventario:status.${item.estado}`)}
          </span>
        </div>
      </header>

      {/* Info principal */}
      <div className="item-detail-grid">
        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Información</h3>
            {canEdit && (
              <button className="icon-btn" onClick={openEditModal} title="Editar Ficha" style={{ padding: '0.4rem 0.8rem' }}>
                ✎ Editar
              </button>
            )}
          </div>
          <table className="detail-table" style={{ marginTop: '1rem' }}>
            <tbody>
              <tr><td>Categoría</td><td>{t(`inventario:categories.${item.categoria}`)}</td></tr>
              <tr><td>Código de Barras</td><td><code>{item.codigo_barras || '—'}</code></td></tr>
              <tr><td>Número de Serie</td><td><code>{item.numero_serie || '—'}</code></td></tr>
              <tr><td>Espacio</td><td>{item.espacio?.nombre || '—'}</td></tr>
              <tr><td>Fecha de Alta</td><td>{new Date(item.fecha_alta).toLocaleDateString()}</td></tr>
              {item.descripcion && <tr><td>Descripción</td><td>{item.descripcion}</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Galería de fotos */}
        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Fotos</h3>
            {canEdit && (
              <button
                className="primary-btn"
                onClick={() => setShowCamera(true)}
                disabled={uploading}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {uploading ? '⏳ Subiendo...' : '📷 Añadir foto'}
              </button>
            )}
          </div>

          {fotos.length === 0 ? (
            <div className="content-placeholder" style={{ padding: '2rem', fontSize: '0.9rem' }}>
              <p>No hay fotos todavía</p>
              {canEdit && <p style={{ marginTop: '0.5rem' }}>Haz clic en "Añadir foto" para capturar una</p>}
            </div>
          ) : (
            <div className="fotos-grid">
              {fotos.map(foto => (
                <div key={foto.id} className="foto-thumb">
                  <img
                    src={`${apiBase}${foto.url}?token=${localStorage.getItem('token')}`}
                    alt={foto.filename}
                    onClick={() => window.open(`${apiBase}${foto.url}?token=${localStorage.getItem('token')}`, '_blank')}
                  />
                  {canEdit && (
                    <button className="foto-delete" onClick={() => handleDeleteFoto(foto.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
