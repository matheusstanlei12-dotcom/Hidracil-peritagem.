import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import PeritagemList from './pages/PeritagemList';
import PeritagemDetails from './pages/PeritagemDetails';
import NewPeritagem from './pages/NewPeritagem';
import UserList from './pages/UserList';
import SimulationSetup from './pages/SimulationSetup';

import PendingPurchases from './pages/PendingPurchases';
import PendingBudget from './pages/PendingBudget';

import Reports from './pages/Reports';

// Placeholder pages for routes that don't exist yet
const Placeholder = ({ title }) => <div style={{ padding: '20px' }}><h1>{title}</h1><p>Em desenvolvimento...</p></div>;

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

function App() {
  const isAndroid = Capacitor.getPlatform() === 'android';

  useEffect(() => {
    // Force title
    document.title = "Trust Tecnologia";

    // Force Favicon refresh (cache busting)
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = `/favicon.png?v=${new Date().getTime()}`;
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/simulation" element={<SimulationSetup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={isAndroid ? <PeritagemList /> : <Dashboard />} />
            <Route path="/peritagens" element={<PeritagemList />} />

            <Route path="/peritagem/:id" element={<PeritagemDetails />} />
            <Route path="/timeline" element={<ProtectedRoute allowedRoles={['Gestor', 'Comprador', 'Orçamentista', 'PCP']}><Timeline /></ProtectedRoute>} />
            <Route path="/nova-peritagem" element={<ProtectedRoute allowedRoles={['Gestor', 'Perito']}><NewPeritagem /></ProtectedRoute>} />
            <Route path="/pendentes-compras" element={<ProtectedRoute allowedRoles={['Gestor', 'Comprador', 'PCP']}><PendingPurchases /></ProtectedRoute>} />
            <Route path="/pendentes-orcamento" element={<ProtectedRoute allowedRoles={['Gestor', 'Orçamentista', 'PCP']}><PendingBudget /></ProtectedRoute>} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['Gestor']}><UserList /></ProtectedRoute>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
