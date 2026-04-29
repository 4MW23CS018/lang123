import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useMutation(api.auth.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userId = await login({ name, password });
      localStorage.setItem('userId', userId);
      // go to onboarding if not completed (will be checked by ProtectedRoute)
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="onboarding-container">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full mb-3 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="big-button">Log In</button>
      </form>
      <p className="mt-3">
        Don't have an account? <Link to="/signup" className="text-indigo-600">Sign up</Link>
      </p>
    </div>
  );
}