import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { QuotationForm } from './pages/QuotationForm';
import { ClientView } from './pages/ClientView';
import { MenuTemplates } from './pages/MenuTemplates';
import { MenuItems } from './pages/MenuItems';
import { Packages } from './pages/Packages';
import { Clients } from './pages/Clients';
import { Calendar } from './pages/Calendar';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/quotation/:id" element={<ClientView />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations/new"
            element={
              <ProtectedRoute>
                <QuotationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations/:id"
            element={
              <ProtectedRoute>
                <QuotationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/menu-templates"
            element={
              <ProtectedRoute>
                <MenuTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/menu-items"
            element={
              <ProtectedRoute>
                <MenuItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/packages"
            element={
              <ProtectedRoute>
                <Packages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
