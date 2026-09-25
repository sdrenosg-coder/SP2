import { useState } from 'react';
import api from '../api/client.js';
import { useQuery } from '@tanstack/react-query';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function PricingRulesPage() {
  const { data: rules, refetch } = useQuery({ queryKey: ['pricing-rules'], queryFn: async () => (await api.get('/pricing-rules')).rules });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [discount, setDiscount] = useState(15);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/pricing-rules', {
      name,
      days_of_week: [1,2,3,4,5],
      start_time: startTime,
      end_time: endTime,
      discount_percent: discount,
      service_ids: [],
    });
    setShowForm(false);
    refetch();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Off-Peak Pricing</h1>
      <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Rule'}</Button>
      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 max-w-md">
          <Input label="Rule Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Discount %" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} required />
          <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          <Button type="submit">Save</Button>
        </form>
      )}
      <div className="mt-6 grid gap-3">
        {rules?.map(r => (
          <div key={r.id} className="card flex justify-between items-center">
            <span className="font-medium">{r.name}</span>
            <span className="text-primary font-semibold">{r.discountPercent}% off</span>
          </div>
        ))}
      </div>
    </div>
  );
}
