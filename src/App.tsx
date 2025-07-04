import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import CreatePaymentLink from './pages/payment/CreatePaymentLink';
import PaymentHistory from './pages/payment/PaymentHistory';
import PaymentList from './pages/payment/PaymentList';
import Settings from './pages/settings/Settings';
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentDeclined from './pages/payment/PaymentDeclined';
import SellersList from './pages/sellers/SellersList';
import SellerDetail from './pages/sellers/SellerDetail';
import MarketplaceList from './pages/admin/MarketplaceList';
import SellerList from './pages/admin/SellerList';
import MarketplaceSellers from './pages/sellers/MarketplaceSellers';
import NotFound from './pages/NotFound';
import PlanList from './pages/plans/PlanList';
import AssinaturaList from './pages/assinaturas/AssinaturaList';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const MarketplaceRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user?.cargo === 'marketplace' ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user?.cargo === 'admin' ? <>{children}</> : <Navigate to="/dashboard" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <>{children}</>;

  // Redirect to appropriate dashboard based on user type
  switch (user.cargo) {
    case 'admin':
      return <Navigate to="/dashboard" />;
    case 'marketplace':
      return <Navigate to="/dashboard" />;
    case 'seller':
      return <Navigate to="/dashboard" />;
    default:
      return <Navigate to="/dashboard" />;
  }
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route path="/pay/:linkId" element={<PaymentPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-declined" element={<PaymentDeclined />} />

      {/* Dashboard Route - Conditional based on user type */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            {user?.cargo === 'admin' ? <AdminDashboard /> : <Dashboard />}
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/marketplaces"
        element={
          <AdminRoute>
            <MarketplaceList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/sellers"
        element={
          <AdminRoute>
            <SellerList />
          </AdminRoute>
        }
      />

      {/* Private Routes */}
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <PaymentHistory />
          </PrivateRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <PrivateRoute>
            <PaymentList />
          </PrivateRoute>
        }
      />
      <Route
        path="/planos"
        element={
          <PrivateRoute>
            <PlanList />
          </PrivateRoute>
        }
      />
      <Route
        path="/assinaturas"
        element={
          <PrivateRoute>
            <AssinaturaList />
          </PrivateRoute>
        }
      />
      <Route
        path="/create-payment-link"
        element={
          <PrivateRoute>
            <CreatePaymentLink />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      {/* Marketplace Routes */}
      <Route
        path="/marketplace-sellers"
        element={
          <MarketplaceRoute>
            <MarketplaceSellers />
          </MarketplaceRoute>
        }
      />
      <Route
        path="/sellers"
        element={
          <MarketplaceRoute>
            <SellersList />
          </MarketplaceRoute>
        }
      />
      <Route
        path="/sellers/:sellerId"
        element={
          <MarketplaceRoute>
            <SellerDetail />
          </MarketplaceRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;