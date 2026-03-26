import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function Users() {
  const { t } = useTranslation(['users', 'common']);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const { register, handleSubmit, reset } = useForm();

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active
      });
    } else {
      reset({
        username: '',
        email: '',
        role: 'alumno',
        active: true,
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingUser) {
        // If password is empty, don't send it
        if (!data.password) delete data.password;
        await api.put(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/users/', data);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user", err);
      alert("Error al guardar el usuario");
    }
  };

  const toggleStatus = async (user: User) => {
    if (window.confirm(t('common:confirm_delete'))) {
      try {
        await api.delete(`/users/${user.id}`);
        fetchUsers();
      } catch (err) {
        console.error("Error deactivating user", err);
      }
    }
  };

  return (
    <div className="users-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('users:title')}</h1>
          <p>{t('common:nav.usuarios')}</p>
        </div>
        <button className="primary-btn" onClick={() => openModal()}>
          <span>+</span> {t('users:new_user')}
        </button>
      </header>

      <div className="data-table-container">
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common:loading')}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('users:table.username')}</th>
                <th>{t('users:table.email')}</th>
                <th>{t('users:table.role')}</th>
                <th>{t('users:table.status')}</th>
                <th>{t('users:table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {t(`common:roles.${user.role}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                      {user.active ? t('users:status.active') : t('users:status.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" onClick={() => openModal(user)} title={t('common:edit')}>
                        ✎
                      </button>
                      {user.active && (
                        <button className="icon-btn danger" onClick={() => toggleStatus(user)} title={t('users:deactivate')}>
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? t('users:edit_user') : t('users:new_user')}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-field">
                    <label>{t('users:form.username')}</label>
                    <input type="text" {...register('username', { required: true })} className="form-group input" />
                  </div>
                  <div className="form-field">
                    <label>{t('users:form.email')}</label>
                    <input type="email" {...register('email', { required: true })} className="form-group input" />
                  </div>
                  <div className="form-field">
                    <label>{t('users:form.password')}</label>
                    <input type="password" {...register('password', { required: !editingUser })} className="form-group input" placeholder={editingUser ? t('users:form.password') : ""} />
                  </div>
                  <div className="form-field">
                    <label>{t('users:form.role')}</label>
                    <select {...register('role')}>
                      <option value="admin">{t('common:roles.admin')}</option>
                      <option value="tecnico">{t('common:roles.tecnico')}</option>
                      <option value="pas">{t('common:roles.pas')}</option>
                      <option value="profesor">{t('common:roles.profesor')}</option>
                      <option value="alumno">{t('common:roles.alumno')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="lang-btn" onClick={() => setIsModalOpen(false)}>{t('common:cancel')}</button>
                <button type="submit" className="primary-btn">
                  {editingUser ? t('users:form.save') : t('users:form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
