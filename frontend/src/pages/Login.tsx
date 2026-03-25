import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t, i18n } = useTranslation('auth');
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'ca' : 'es';
    i18n.changeLanguage(newLang);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, new URLSearchParams({
        username: data.username,
        password: data.password
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token, response.data.user);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setServerError(t('error_credentials'));
      } else {
        setServerError(t('error_server'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-visual">
        <div className="decor-circle"></div>
        <h1 className="brand-title">Eskol.</h1>
        <p className="brand-subtitle">Gestión Unificada del Centro</p>
      </div>

      <div className="login-panel">
        <div className="lang-switcher">
          <button type="button" onClick={toggleLanguage} className="lang-btn">
            {i18n.language === 'es' ? 'Català' : 'Castellano'}
          </button>
        </div>

        <div className="login-box">
          <h2 className="login-heading">{t('login_title')}</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="form-group">
              <label>{t('username')}</label>
              <input 
                type="text" 
                {...register('username', { required: true })} 
                className={errors.username ? 'input-error' : ''}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label>{t('password')}</label>
              <input 
                type="password" 
                {...register('password', { required: true })} 
                className={errors.password ? 'input-error' : ''}
              />
            </div>

            {serverError && <div className="error-banner">{serverError}</div>}

            <button type="submit" disabled={isSubmitting} className="submit-btn hover-fx">
              {isSubmitting ? t('logging_in') : t('login_button')}
            </button>
          </form>
        </div>
        
        <div className="login-footer">
          &copy; {new Date().getFullYear()} Eskol Platform.
        </div>
      </div>
    </div>
  );
}
