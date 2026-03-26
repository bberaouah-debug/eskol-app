import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';
import './i18n';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<div>Página de Inventario (Próximamente)</div>} />
            
            {/* Rutas para técnicos y admins */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'tecnico']}><Outlet /></ProtectedRoute>}>
              <Route path="/incidencias" element={<div>Panel de Incidencias (Próximamente)</div>} />
            </Route>

            {/* Rutas solo para admins */}
            <Route element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
              <Route path="/usuarios" element={<Users />} />
              <Route path="/configuracion" element={<div>Configuración del Sistema (Próximamente)</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
