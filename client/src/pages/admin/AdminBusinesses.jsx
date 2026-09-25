import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import Button from '../../components/ui/Button.jsx';

export default function AdminBusinesses() {
  const queryClient = useQueryClient();
  const { data: businesses } = useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: async () => (await api.get('/admin/businesses')).businesses,
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, plan }) => api.patch(`/admin/businesses/${id}`, { plan }),
    onSuccess: () => queryClient.invalidateQueries(['admin', 'businesses']),
  });

  const toggleSuspend = useMutation({
    mutationFn: async ({ id, suspended }) => api.patch(`/admin/businesses/${id}`, { suspended }),
    onSuccess: () => queryClient.invalidateQueries(['admin', 'businesses']),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark mb-6">Businesses</h1>
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
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
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
