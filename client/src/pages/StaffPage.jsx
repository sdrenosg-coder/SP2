import { useStaff } from '../api/hooks.js';

export default function StaffPage() {
  const { data: staff } = useStaff();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Staff</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff?.map(s => (
          <div key={s.id} className="card">
            <div className="font-semibold text-lg">{s.name}</div>
            <div className="text-sm text-gray-500">{s.title}</div>
            <div className="text-sm">Commission: {s.commissionRate}%</div>
            <div className="text-sm">Active: {s.isActive ? 'Yes' : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
