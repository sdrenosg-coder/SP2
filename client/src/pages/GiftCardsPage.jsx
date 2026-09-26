import { useEffect, useState } from 'react';
import { featuresApi, resolveBusinessId, fmtDate, money } from '../api/features.js';

export default function GiftCardsPage({ businessId }) {
  const bid = resolveBusinessId(businessId);
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ amount: '', purchaserEmail: '', recipientEmail: '', expiresAt: '' });
  const [lookup, setLookup] = useState({ code: '', amount: '' });
  const [found, setFound] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => featuresApi.listGiftCards(bid).then(setCards).catch((e) => setError(e.message));
  useEffect(() => { if (bid) load(); }, [bid]);

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''));

  const issue = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const card = await featuresApi.issueGiftCard(bid, clean(form));
      setMsg(`Issued gift card ${card.code}`);
      setForm({ amount: '', purchaserEmail: '', recipientEmail: '', expiresAt: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const check = async () => {
    setError(''); setFound(null);
    try { setFound(await featuresApi.getGiftCard(bid, lookup.code.trim())); }
    catch (err) { setError(err.message); }
  };

  const redeem = async () => {
    setError(''); setMsg('');
    try {
      const r = await featuresApi.redeemGiftCard(bid, lookup.code.trim(), { amount: Number(lookup.amount) });
      setMsg(`Applied ${money(r.applied)} — remaining balance ${money(r.balance)}`);
      check(); load();
    } catch (err) { setError(err.message); }
  };

  if (!bid) return <div className="p-6 text-gray-500">No business selected.</div>;

  const input = 'border rounded-lg px-3 py-2 w-full';
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gift cards</h1>
      {msg && <div className="rounded-lg bg-green-50 text-green-700 p-3">{msg}</div>}
      {error && <div className="rounded-lg bg-red-50 text-red-700 p-3">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={issue} className="rounded-xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Issue gift card</h2>
          <input className={input} type="number" min="1" step="0.01" placeholder="Amount" required
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className={input} type="email" placeholder="Purchaser email (optional)"
            value={form.purchaserEmail} onChange={(e) => setForm({ ...form, purchaserEmail: e.target.value })} />
          <input className={input} type="email" placeholder="Recipient email (optional)"
            value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} />
          <input className={input} type="date"
            value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <button className="w-full bg-indigo-600 text-white rounded-lg py-2">Issue</button>
        </form>

        <div className="rounded-xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Check / redeem</h2>
          <input className={input} placeholder="XXXX-XXXX-XXXX" value={lookup.code}
            onChange={(e) => setLookup({ ...lookup, code: e.target.value.toUpperCase() })} />
          <button type="button" onClick={check} className="w-full border rounded-lg py-2">Check balance</button>
          {found && (
            <div className="text-sm bg-gray-50 rounded-lg p-3">
              Balance <b>{money(found.balance)}</b> of {money(found.initial_amount)} · {found.status}
              {found.expires_at && <> · expires {fmtDate(found.expires_at)}</>}
            </div>
          )}
          <input className={input} type="number" min="0.01" step="0.01" placeholder="Amount to redeem"
            value={lookup.amount} onChange={(e) => setLookup({ ...lookup, amount: e.target.value })} />
          <button type="button" onClick={redeem} disabled={!lookup.code || !lookup.amount}
            className="w-full bg-gray-900 text-white rounded-lg py-2 disabled:opacity-50">Redeem</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Code</th><th className="p-3">Balance</th><th className="p-3">Initial</th>
              <th className="p-3">Recipient</th><th className="p-3">Status</th><th className="p-3">Created</th></tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{money(c.balance)}</td>
                <td className="p-3">{money(c.initial_amount)}</td>
                <td className="p-3">{c.recipient_email || '—'}</td>
                <td className="p-3 capitalize">{c.status}</td>
                <td className="p-3">{fmtDate(c.created_at)}</td>
              </tr>
            ))}
            {!cards.length && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No gift cards yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
