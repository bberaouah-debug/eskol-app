import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation('auth');

  if (isLoading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="forbidden-container">
        <h1>403</h1>
        <p>{t('forbidden')}</p>
        <button onClick={() => window.history.back()}>Volver</button>
      </div>
    );
  }

  return <>{children}</>;
}
