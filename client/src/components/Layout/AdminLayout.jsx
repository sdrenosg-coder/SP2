import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/businesses', label: 'Businesses' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">B</span>
          <div>
            <h1 className="text-xl font-bold">Bookly Admin</h1>
            <p className="text-xs text-gray-400">Superadmin Console</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {adminNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-gray-300">{user?.name}</div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm mt-2">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
