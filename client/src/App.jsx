import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import BookingWizard from './pages/BookingWizard.jsx';
import ClientCRM from './pages/ClientCRM.jsx';
import StaffPage from './pages/StaffPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PricingRulesPage from './pages/PricingRulesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import CustomerPortal from './pages/CustomerPortal.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/b/:slug" element={<BookingWizard />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/clients" element={<ClientCRM />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pricing" element={<PricingRulesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/my-bookings" element={<CustomerPortal />} />
            </Route>
          </Route>
        </Routes>
      </BusinessProvider>
    </AuthProvider>
  );
}
