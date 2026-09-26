import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ClientCRM from './pages/ClientCRM.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import StaffPage from './pages/StaffPage.jsx';
import PricingRulesPage from './pages/PricingRulesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BookingWizard from './pages/BookingWizard.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import CustomerPortal from './pages/CustomerPortal.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminBusinesses from './pages/admin/AdminBusinesses.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

import ManageBookingPage from './pages/ManageBookingPage.jsx';
import GiftCardsPage from './pages/GiftCardsPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/book/:slug" element={<BookingWizard />} />
      <Route path="/checkout/:appointmentId" element={<CheckoutPage />} />
      <Route path="/portal" element={<CustomerPortal />} />
      <Route path="/manage/:token" element={<ManageBookingPage />} />

      {/* Business (authenticated) */}
      <Route path="/onboarding" element={guard(<Onboarding />)} />
      <Route path="/dashboard" element={guard(<Dashboard />)} />
      <Route path="/calendar" element={guard(<CalendarPage />)} />
      <Route path="/clients" element={guard(<ClientCRM />)} />
      <Route path="/services" element={guard(<ServicesPage />)} />
      <Route path="/staff" element={guard(<StaffPage />)} />
      <Route path="/pricing-rules" element={guard(<PricingRulesPage />)} />
      <Route path="/reports" element={guard(<ReportsPage />)} />
      <Route path="/settings" element={guard(<SettingsPage />)} />
      <Route path="/gift-cards" element={guard(<GiftCardsPage />)} />
      <Route path="/audit-log" element={guard(<AuditLogPage />)} />
      <Route path="/audit" element={<Navigate to="/audit-log" replace />} />

      {/* Platform admin */}
      <Route path="/admin" element={guard(<AdminDashboard />)} />
      <Route path="/admin/businesses" element={guard(<AdminBusinesses />)} />
      <Route path="/admin/users" element={guard(<AdminUsers />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
