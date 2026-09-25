import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await signup({ name, email, password }); navigate('/onboarding'); } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="card w-96">
        <h2 className="text-2xl font-bold mb-6 text-dark">Create Account</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full">Sign Up</Button>
        <div className="mt-4 text-sm">Already have an account? <Link to="/login" className="text-primary">Login</Link></div>
      </form>
    </div>
  );
}
