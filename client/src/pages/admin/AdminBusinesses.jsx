import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import Button from '../../components/ui/Button.jsx';

export default function AdminBusinesses() {
  const queryClient = useQueryClient();
  const { data: businesses, error } = useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: async () => (await api.get('/admin/businesses')).businesses,
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, plan }) => api.patch(`/admin/businesses/${id}`, { plan }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] }),
  });

  const toggleSuspend = useMutation({
    mutationFn: async ({ id, suspended }) => api.patch(`/admin/businesses/${id}`, { suspended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] }),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark mb-6">Businesses</h1>
      <p className="text-sm text-gray-500 mb-4">Plans are assigned manually here; changing a plan does not create a paid subscription or charge a customer.</p>
      {(error || updatePlan.error || toggleSuspend.error) && (
        <p role="alert" className="text-red-600 mb-4">{(error || updatePlan.error || toggleSuspend.error).message}</p>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {businesses?.map(b => (
              <tr key={b.id}>
                <td className="px-4 py-3">{b.name}</td>
                <td className="px-4 py-3">{b.slug}</td>
                <td className="px-4 py-3">
                  <select
                    value={b.plan}
                    onChange={e => updatePlan.mutate({ id: b.id, plan: e.target.value })}
                    className="input-field w-auto"
                  >
                    <option value="free">Starter (Free)</option>
                    <option value="pro">Growth (Pro)</option>
                    <option value="business">Studio (Business)</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {b.suspended ? (
                    <span className="text-red-600 font-medium">Suspended</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" onClick={() => toggleSuspend.mutate({ id: b.id, suspended: !b.suspended })}>
                    {b.suspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
