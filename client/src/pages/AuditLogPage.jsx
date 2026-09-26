import { useEffect, useState } from 'react';
import { featuresApi, resolveBusinessId, fmtDate } from '../api/features.js';

export default function AuditLogPage({ businessId }) {
  const bid = resolveBusinessId(businessId);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (bid) featuresApi.listAudit(bid).then(setRows).catch((e) => setError(e.message));
  }, [bid]);

  if (!bid) return <div className="p-6 text-gray-500">No business selected.</div>;
  const shown = rows.filter((r) =>
    !filter || `${r.action} ${r.actor} ${r.entity}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Audit log</h1>
        <input className="border rounded-lg px-3 py-2" placeholder="Filter…" value={filter}
          onChange={(e) => setFilter(e.target.value)} />
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 p-3">{error}</div>}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th>
              <th className="p-3">Entity</th><th className="p-3">Details</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                <td className="p-3">{r.actor}</td>
                <td className="p-3 font-mono">{r.action}</td>
                <td className="p-3">{r.entity ? `${r.entity} #${r.entity_id}` : '—'}</td>
                <td className="p-3 font-mono text-xs text-gray-500">
                  {r.meta && Object.keys(r.meta).length ? JSON.stringify(r.meta) : ''}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan="5" className="p-6 text-center text-gray-400">No entries</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
