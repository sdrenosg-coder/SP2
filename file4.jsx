// client/src/pages/BookingWizard.jsx (modified – added chain booking option)
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAvailability } from '../api/hooks.js';
import { useQuery } from '@tanstack/react-query';

export default function BookingWizard() {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]); // array of {serviceId, staffId?}
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // for single service
  const [selectedChain, setSelectedChain] = useState(null); // for chain booking
  const [clientInfo, setClientInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [bookingComplete, setBookingComplete] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['widget-config', slug],
    queryFn: async () => (await api.get(`/widget/${slug}/config`)),
    enabled: Boolean(slug),
  });

  // Toggle service selection for chain booking
  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === serviceId);
      if (exists) return prev.filter(s => s.serviceId !== serviceId);
      return [...prev, { serviceId, staffId: null }];
    });
  };

  const isChainMode = selectedServices.length > 1;

  // For single service availability
  const singleServiceId = selectedServices.length === 1 ? selectedServices[0].serviceId : null;
  const { data: slots } = useAvailability(slug, singleServiceId, date, null);

  // For chain booking, call custom endpoint
  const [chainCandidates, setChainCandidates] = useState([]);
  const fetchChainSlots = async () => {
    if (selectedServices.length < 2 || !date) return;
    try {
      const res = await api.post('/chain-booking/availability', {
        businessSlug: slug,
        services: selectedServices.map(s => ({ serviceId: s.serviceId, staffId: s.staffId })),
        date,
      });
      setChainCandidates(res.candidates || []);
      setStep(3);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleServiceSelect = (id) => { setSelectedServices([{ serviceId: id, staffId: null }]); setStep(2); };
  const handleDateSelect = (d) => { setDate(d); if (selectedServices.length > 1) fetchChainSlots(); else setStep(3); };
  const handleSlotSelect = (slot) => { setSelectedSlot(slot); setStep(4); };
  const handleChainSelect = (chain) => { setSelectedChain(chain); setStep(4); };

  const handleSubmit = async () => {
    try {
      const clientRes = await api.post('/clients', { first_name: clientInfo.firstName, last_name: clientInfo.lastName, email: clientInfo.email, phone: clientInfo.phone });
      const clientId = clientRes.client.id;

      if (isChainMode && selectedChain) {
        // Create each appointment in chain sequentially with groupId
        const groupId = crypto.randomUUID();
        for (const item of selectedChain.items) {
          await api.post('/appointments', {
            clientId,
            serviceId: item.serviceId,
            staffId: item.staffId,
            startAt: item.startAt,
            source: 'widget',
            groupId,
          });
        }
      } else if (selectedSlot) {
        await api.post('/appointments', {
          clientId,
          serviceId: selectedServices[0].serviceId,
          staffId: selectedSlot.staffId,
          startAt: selectedSlot.startAt,
          source: 'widget',
        });
      }
      setBookingComplete(true);
    } catch (err) { alert(err.message); }
  };

  if (bookingComplete) return <div className="p-8 text-center">Booking confirmed! Check your email.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book at {config?.business?.name}</h1>
      {step === 1 && (
        <div>
          <h2 className="text-xl mb-2">Select Services</h2>
          <p className="text-sm text-gray-500 mb-2">Select one for simple booking, or multiple for chain booking (back-to-back appointments).</p>
          <div className="grid gap-2">
            {config?.services?.map(s => (
              <button
                key={s.id}
                onClick={() => toggleService(s.id)}
                className={`card text-left hover:bg-gray-50 ${selectedServices.some(ss => ss.serviceId === s.id) ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-sm text-gray-500">{s.durationMinutes} min · ${s.price}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(2)} className="btn-primary">Continue</button>
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
          <h2 className="text-xl mb-2">{isChainMode ? 'Select Chain Option' : 'Available Slots'}</h2>
          {isChainMode ? (
            <div className="grid gap-2">
              {chainCandidates.map((chain, idx) => (
                <button key={idx} onClick={() => handleChainSelect(chain)} className="card flex justify-between items-center">
                  <span>
                    {chain.items.map((item, i) => (
                      <div key={i} className="text-sm">{i+1}. {item.staffName} at {new Date(item.startAt).toLocaleTimeString()}</div>
                    ))}
                  </span>
                  <span className="text-lg font-bold">${chain.totalPrice.toFixed(2)}</span>
                </button>
              ))}
            </div>
          ) : (
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
          )}
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
