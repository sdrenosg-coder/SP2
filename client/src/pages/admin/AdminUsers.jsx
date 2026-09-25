import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import Button from '../../components/ui/Button.jsx';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: users, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await api.get('/admin/users')).users,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role_global }) => api.patch(`/admin/users/${id}`, { role_global }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark mb-6">Users</h1>
      {(error || updateRole.error || toggleActive.error) && (
        <p role="alert" className="text-red-600 mb-4">{(error || updateRole.error || toggleActive.error).message}</p>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Global Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.roleGlobal}
                    onChange={e => updateRole.mutate({ id: u.id, role_global: e.target.value })}
                    className="input-field w-auto"
                  >
                    <option value="user">User</option>
                    <option value="superadmin">Superadmin</option>
                    <option value="support">Support</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-red-600 font-medium">Deactivated</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.isActive })}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
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
