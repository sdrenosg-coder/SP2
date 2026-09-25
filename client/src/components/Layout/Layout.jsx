import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBusiness } from '../../context/BusinessContext.jsx';
import socket from '../../socket.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/clients', label: 'Clients' },
  { to: '/staff', label: 'Staff' },
  { to: '/services', label: 'Services' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { business } = useBusiness();

  useEffect(() => {
    if (business?.id) {
      socket.emit('joinBusiness', business.id);
      return () => socket.emit('leaveBusiness', business.id);
    }
  }, [business?.id]);

  return (
    <div className="flex h-screen bg-surface">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">B</span>
          <div>
            <h1 className="text-xl font-bold">Bookly</h1>
            {business && <p className="text-xs text-gray-400">{business.name}</p>}
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-gray-300">{user?.name}</div>
          <button onClick={logout} className="text-red-400 hover:text-red-300 text-sm mt-2">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
