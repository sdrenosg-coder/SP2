import { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext.jsx';
import { useAppointments, useStaff } from '../api/hooks.js';
import socket from '../socket.js';

export default function CalendarPage() {
  const { business } = useBusiness();
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const { data: appointments } = useAppointments(date);
  const { data: staffList } = useStaff();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (business?.id) {
      socket.on('appointmentCreated', () => setTick(u => u+1));
      socket.on('appointmentUpdated', () => setTick(u => u+1));
      return () => { socket.off('appointmentCreated'); socket.off('appointmentUpdated'); };
    }
  }, [business?.id]);

  if (!business) return <div>Loading...</div>;
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 9);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-dark">Calendar</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              {staffList?.map(s => <th key={s.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{s.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timeSlots.map(hour => (
              <tr key={hour}>
                <td className="px-4 py-2 text-sm">{hour}:00</td>
                {staffList?.map(s => {
                  const appts = appointments?.filter(a => a.items?.some(item => item.staffId === s.id && new Date(item.startAt).getHours() === hour));
                  return (
                    <td key={s.id} className="px-4 py-2 border-l border-gray-100" style={{ minHeight: '50px' }}>
                      {appts?.map(a => (
                        <div key={a.id} className="bg-primary text-white text-xs rounded p-1 mb-1">
                          Service with {a.client?.firstName}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
