import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function Landing() {
  const [demoAvailable, setDemoAvailable] = useState(false);

  useEffect(() => {
    api.get('/auth/demo-status')
      .then(res => setDemoAvailable(res.available))
      .catch(() => setDemoAvailable(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-primary mb-4">Bookly</h1>
      <p className="text-xl text-gray-700 mb-8">Smarter booking for service businesses</p>
      <div className="space-x-4">
        <Link to="/signup" className="btn-primary">Get Started</Link>
        <Link to="/login" className="btn-secondary">Login</Link>
      </div>
      {demoAvailable && (
        <div className="mt-12 text-sm text-gray-500">
          Demo data is available for this environment.
        </div>
      )}
    </div>
  );
}
