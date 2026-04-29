import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const signup = useMutation(api.auth.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userId = await signup({ name, password });
      localStorage.setItem('userId', userId);
      navigate('/onboarding');  // force onboarding after signup
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="onboarding-container">
      <h2>Create Account</h2>
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
        <button type="submit" className="big-button">Sign Up</button>
      </form>
      <p className="mt-3">
        Already have an account? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}