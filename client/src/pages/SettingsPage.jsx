import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import api from '../api/client.js';

export default function SettingsPage() {
  const { business } = useBusiness();
  const [name, setName] = useState(business?.name || '');
  const [slug, setSlug] = useState(business?.slug || '');
  const [timezone, setTimezone] = useState(business?.timezone || 'UTC');
  const [currency, setCurrency] = useState(business?.currency || 'USD');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await api.put(`/businesses/${business.id}`, { name, slug, timezone, currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-dark">Settings</h1>
      <div className="card max-w-md">
        <Input label="Business Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
        <Input label="Timezone" value={timezone} onChange={e => setTimezone(e.target.value)} />
        <Input label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} />
        <Button onClick={handleSave}>Save</Button>
        {saved && <span className="ml-2 text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
