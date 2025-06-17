import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      navigate(`/${role.toLowerCase()}-dashboard`);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/login', { email, password });

      const token = res.data.token;
      const role = res.data.user.role;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      navigate(`/${role.toLowerCase()}-dashboard`);
    } catch (err) {
      console.error(err);
      setError('User not found. Redirecting to Signup...');
      setTimeout(() => navigate('/signup'), 2000);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Login
        </button>
      </form>
      <p className="mt-4 text-sm">
        Don’t have an account?{' '}
        <button onClick={() => navigate('/signup')} className="text-blue-600 underline">
          Signup
        </button>
      </p>
    </div>
  );
}
