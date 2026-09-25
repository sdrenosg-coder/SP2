import { useQuery } from '@tanstack/react-query';
import api from '../../api/client.js';

export default function AdminDashboard() {
  const { data: stats, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')),
  });

  return (
    <div className="vStack">
      <h1 className="text-3xl font-bold text-dark mb-6">Platform Overview</h1>
      {error && <p role="alert" className="text-red-600 mb-4">{error.message}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.users || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Businesses</div>
          <div className="stat-value">{stats?.businesses || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Appointments</div>
          <div className="stat-value">{stats?.appointments || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clients</div>
          <div className="stat-value">{stats?.clients || 0}</div>
        </div>
      </div>
    </div>
  );
}
