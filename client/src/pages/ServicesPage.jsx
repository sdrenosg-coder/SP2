import { useServices } from '../api/hooks.js';

export default function ServicesPage() {
  const { data: services } = useServices();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map(s => (
          <div key={s.id} className="card">
            <div className="font-semibold text-lg">{s.name}</div>
            <div className="text-sm text-gray-500">{s.category}</div>
            <div className="text-sm">{s.durationMinutes} min · ${s.price}</div>
            <div className="text-sm">Rebook interval: {s.rebookIntervalDays || 'N/A'} days</div>
          </div>
        ))}
      </div>
    </div>
  );
}
