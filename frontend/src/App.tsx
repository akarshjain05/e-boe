import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Suspense, lazy } from 'react';

// Lazy loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const AppLayout = lazy(() => import('./components/layout/AppLayout').then(module => ({ default: module.AppLayout })));

// Main Feature Pages
const Dashboard = lazy(() => import('./pages/dashboard'));
const Customers = lazy(() => import('./pages/customers'));
const Inventory = lazy(() => import('./pages/inventory'));
const Bills = lazy(() => import('./pages/bills'));
const CreateBill = lazy(() => import('./pages/bills/CreateBill'));
const EditBill = lazy(() => import('./pages/bills/EditBill'));
const BillDetails = lazy(() => import('./pages/bills/BillDetails'));
const ListBillsOfExchange = lazy(() => import('./pages/bills-of-exchange/ListBillsOfExchange'));
const IssueBillOfExchange = lazy(() => import('./pages/bills-of-exchange/IssueBillOfExchange'));
const EndorseBill = lazy(() => import('./pages/bills-of-exchange/EndorseBill'));
const DiscountBill = lazy(() => import('./pages/bills-of-exchange/DiscountBill'));
const BillsOfExchangeLayout = lazy(() => import('./pages/bills-of-exchange/Layout'));
const Payments = lazy(() => import('./pages/payments'));
const Passbook = lazy(() => import('./pages/passbook'));
const Reports = lazy(() => import('./pages/reports'));
const Settings = lazy(() => import('./pages/settings'));
const NotFound = lazy(() => import('./pages/errors/NotFound'));
const ServerError = lazy(() => import('./pages/errors/ServerError'));

// Public Portal Route
const PublicBillView = lazy(() => import('./pages/public/PublicBillView').then(module => ({ default: module.PublicBillView })));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Public only route
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        
        {/* Public Portal Route */}
        <Route path="/bill/:token" element={<PublicBillView />} />
        
        {/* Protected Routes inside App Layout */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="bills">
            <Route index element={<Bills />} />
            <Route path="create" element={<CreateBill />} />
            <Route path=":id" element={<BillDetails />} />
            <Route path=":id/edit" element={<EditBill />} />
          </Route>
          <Route path="bills-of-exchange" element={<BillsOfExchangeLayout />}>
            <Route index element={<ListBillsOfExchange />} />
            <Route path="issue" element={<IssueBillOfExchange />} />
            <Route path="endorse" element={<EndorseBill />} />
            <Route path="discount" element={<DiscountBill />} />
          </Route>
          <Route path="payments" element={<Payments />} />
          <Route path="passbook" element={<Passbook />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="/500" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
