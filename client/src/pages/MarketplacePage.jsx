import { useState } from 'react';
import api from '../api/client.js';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  const [q, setQ] = useState('');
  const { data: businesses } = useQuery({ queryKey: ['marketplace', q], queryFn: async () => (await api.get(`/marketplace/search?q=${q}`)).businesses });
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-dark">Discover Businesses</h1>
      <input type="search" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} className="input-field mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses?.map(b => (
          <div key={b.id} className="card">
            <div className="font-semibold text-lg">{b.name}</div>
            <div className="text-sm text-gray-500">{b.category}</div>
            <Link to={`/b/${b.slug}`} className="text-primary mt-2 inline-block">Book Now</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
