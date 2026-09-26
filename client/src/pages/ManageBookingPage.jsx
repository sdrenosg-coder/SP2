import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { featuresApi, fmtDate } from '../api/features.js';

export default function ManageBookingPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [newTime, setNewTime] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => featuresApi.getManage(token).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [token]);

  const doReschedule = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    try {
      await featuresApi.reschedule(token, new Date(newTime).toISOString());
      setMsg('Your appointment was rescheduled.');
      setNewTime('');
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const doCancel = async () => {
    if (!confirm('Cancel this appointment?')) return;
    setBusy(true); setError(''); setMsg('');
    try {
      const r = await featuresApi.cancel(token);
      setMsg(r.depositForfeited
        ? 'Cancelled. As this was a late cancellation, your deposit is non-refundable.'
        : r.lateCancel ? 'Cancelled (late cancellation).' : 'Your appointment was cancelled.');
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (error && !data) return <div className="max-w-lg mx-auto p-6 text-red-600">{error}</div>;
  if (!data) return <div className="max-w-lg mx-auto p-6 text-gray-500">Loading…</div>;

  const { appointment: a, business, policy } = data;
  const closed = ['cancelled', 'completed', 'no_show'].includes(a.status);

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Manage your booking</h1>
      <p className="text-gray-500 mb-6">{business.name}</p>

      <div className="rounded-xl border bg-white p-4 mb-4 space-y-1">
        <div><span className="text-gray-500">When:</span> {fmtDate(a.startAt)}</div>
        <div><span className="text-gray-500">Status:</span> <span className="capitalize">{a.status?.replace('_', ' ')}</span></div>
      </div>

      {msg && <div className="mb-4 rounded-lg bg-green-50 text-green-700 p-3">{msg}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 p-3">{error}</div>}

      {!closed && (
        <>
          {!policy.allowed && (
            <div className="mb-4 rounded-lg bg-amber-50 text-amber-800 p-3 text-sm">
              Changes must be made at least {policy.minCancelHours}h before your appointment.
              Rescheduling is unavailable; cancelling now counts as a late cancellation.
            </div>
          )}
          {policy.allowed && (
            <form onSubmit={doReschedule} className="rounded-xl border bg-white p-4 mb-4">
              <label className="block text-sm font-medium mb-2">New date & time</label>
              <input type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-3" required />
              <button disabled={busy} className="w-full bg-indigo-600 text-white rounded-lg py-2 disabled:opacity-50">
                Reschedule
              </button>
            </form>
          )}
          <button onClick={doCancel} disabled={busy}
            className="w-full border border-red-300 text-red-600 rounded-lg py-2 disabled:opacity-50">
            Cancel appointment
          </button>
        </>
      )}
    </div>
  );
}
