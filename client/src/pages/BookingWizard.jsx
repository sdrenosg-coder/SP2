import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAvailability } from '../api/hooks.js';
import { useQuery } from '@tanstack/react-query';

export default function BookingWizard() {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [bookingComplete, setBookingComplete] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['widget-config', slug],
    queryFn: async () => (await api.get(`/widget/${slug}/config`)),
    enabled: Boolean(slug),
  });

  const { data: slots } = useAvailability(slug, serviceId, date, null);

  const handleServiceSelect = (id) => { setServiceId(id); setStep(2); };
  const handleDateSelect = (d) => { setDate(d); setStep(3); };
  const handleSlotSelect = (slot) => { setSelectedSlot(slot); setStep(4); };

  const handleSubmit = async () => {
    try {
      const clientRes = await api.post('/clients', { first_name: clientInfo.firstName, last_name: clientInfo.lastName, email: clientInfo.email, phone: clientInfo.phone });
      const clientId = clientRes.client.id;
      await api.post('/appointments', {
        clientId,
        serviceId,
        staffId: selectedSlot.staffId,
        startAt: selectedSlot.startAt,
        source: 'widget',
      });
      setBookingComplete(true);
    } catch (err) { alert(err.message); }
  };

  if (bookingComplete) return <div className="p-8 text-center">Booking confirmed! Check your email.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book at {config?.business?.name}</h1>
      {step === 1 && (
        <div>
          <h2 className="text-xl mb-2">Select a Service</h2>
          <div className="grid gap-2">
            {config?.services?.map(s => (
              <button key={s.id} onClick={() => handleServiceSelect(s.id)} className="card text-left hover:bg-gray-50">
                <div>{s.name}</div>
                <div className="text-sm text-gray-500">{s.durationMinutes} min · ${s.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl mb-2">Select Date</h2>
          <input type="date" onChange={e => handleDateSelect(e.target.value)} className="input-field" />
          <button onClick={() => setStep(1)} className="btn-secondary ml-2">Back</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-xl mb-2">Available Slots</h2>
          <div className="grid gap-2">
            {slots?.map((slot, idx) => (
              <button key={idx} onClick={() => handleSlotSelect(slot)} className="card flex justify-between items-center">
                <span>{new Date(slot.startAt).toLocaleTimeString()}</span>
                <span className="text-sm">${slot.price}</span>
                {slot.isRecommended && <span className="text-green-600 text-sm">Recommended</span>}
                {slot.discountPercent > 0 && <span className="text-orange-500 text-sm">-{slot.discountPercent}%</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="btn-secondary mt-2">Back</button>
        </div>
      )}
      {step === 4 && (
        <div>
          <h2 className="text-xl mb-2">Your Details</h2>
          <input placeholder="First Name" value={clientInfo.firstName} onChange={e => setClientInfo({...clientInfo, firstName: e.target.value})} className="input-field mb-2" />
          <input placeholder="Last Name" value={clientInfo.lastName} onChange={e => setClientInfo({...clientInfo, lastName: e.target.value})} className="input-field mb-2" />
          <input placeholder="Email" type="email" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} className="input-field mb-2" />
          <input placeholder="Phone" value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} className="input-field mb-2" />
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="btn-secondary">Back</button>
            <button onClick={handleSubmit} className="btn-primary">Confirm Booking</button>
          </div>
        </div>
      )}
    </div>
  );
}
