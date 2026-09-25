import { useClients } from '../api/hooks.js';

export default function ClientCRM() {
  const { data: clients } = useClients();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Clients</h1>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loyalty Points</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {clients?.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${c.riskScore > 70 ? 'bg-red-100 text-red-800' : c.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{c.riskScore}</span></td>
                <td className="px-4 py-3">{c.loyaltyPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
