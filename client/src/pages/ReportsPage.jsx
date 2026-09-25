import { useQuery } from '@tanstack/react-query';
import api from '../api/client.js';

export default function ReportsPage() {
  const { data: summary } = useQuery({ queryKey: ['reports', 'summary'], queryFn: async () => (await api.get('/reports/summary')).summary });
  const { data: insights } = useQuery({ queryKey: ['reports', 'health'], queryFn: async () => (await api.get('/reports/health')).insights });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value">${summary?.revenue?.toFixed(2) || '0.00'}</div></div>
        <div className="stat-card"><div className="stat-label">No-show Loss (estimated)</div><div className="stat-value">${insights?.find(i => i.type === 'no_show_loss')?.metric || '0.00'}</div></div>
      </div>
      <h2 className="text-xl font-semibold mb-4 text-dark">Health Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights?.map((i, idx) => (
          <div key={idx} className="card">
            <div className="text-sm font-medium text-gray-500 capitalize">{i.type.replace('_',' ')}</div>
            <div className="text-xl font-bold mt-1 text-dark">{i.metric}</div>
            <div className="text-gray-600">{i.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
