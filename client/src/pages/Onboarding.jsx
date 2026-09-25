import { useState } from 'react';
import api from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Beauty & Wellness');
  const [timezone, setTimezone] = useState('America/New_York');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/businesses', { name, slug, category, timezone }); navigate('/dashboard'); } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="card w-96">
        <h2 className="text-2xl font-bold mb-6 text-dark">Set Up Your Business</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <Input label="Business Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="URL Slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="your-business" required />
        <Input label="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <Input label="Timezone" value={timezone} onChange={e => setTimezone(e.target.value)} />
        <Button type="submit" className="w-full">Create Business</Button>
      </form>
    </div>
  );
}
