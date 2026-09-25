import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import api from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.roleGlobal === 'superadmin') {
        navigate('/admin');
      } else {
        try {
          await api.get('/businesses/current');
          navigate('/dashboard');
        } catch (err) {
          if (err.status === 403 && err.message === 'No business assigned') navigate('/onboarding');
          else throw err;
        }
      }
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="card w-96">
        <h2 className="text-2xl font-bold mb-6 text-dark">Login</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <Input label="Email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full">Login</Button>
        <div className="mt-4 text-sm">Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link></div>
      </form>
    </div>
  );
}
