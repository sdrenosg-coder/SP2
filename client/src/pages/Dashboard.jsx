import { useQuery } from '@tanstack/react-query';
import api from '../api/client.js';
import { useBusiness } from '../context/BusinessContext.jsx';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { business } = useBusiness();
  const { data: summary } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => (await api.get('/reports/summary')).summary,
    enabled: Boolean(business?.id),
  });
  const { data: insights } = useQuery({
    queryKey: ['reports', 'health'],
    queryFn: async () => (await api.get('/reports/health')).insights,
    enabled: Boolean(business?.id),
  });

  return (
    <div className="vStack">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-1">Dashboard</h1>
        {business && <p className="text-gray-500">Welcome back, {business.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${summary?.revenue?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Appointments</div>
          <div className="stat-value">{summary?.totalAppointments || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Clients</div>
          <div className="stat-value">{summary?.activeClients || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">No-shows</div>
          <div className="stat-value">{summary?.noShows || 0}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-dark mt-8">Business Health Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights?.map((insight, i) => (
          <div key={i} className="card">
            <div className="text-sm font-medium text-gray-500 capitalize">{insight.type.replace('_',' ')}</div>
            <div className="text-2xl font-bold text-dark mt-1">{insight.metric}</div>
            <div className="text-gray-600 mt-1">{insight.detail}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <Link to="/calendar" className="btn-primary">Open Calendar</Link>
        <Link to={`/b/${business?.slug || 'glow-studio'}`} className="btn-secondary">Public Booking Page</Link>
      </div>
    </div>
  );
}
