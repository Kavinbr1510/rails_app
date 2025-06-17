import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch available roles on mount
  useEffect(() => {
    axios.get('http://localhost:3000/signup') // hits RegistrationsController#new
      .then(res => {
        setRoles(res.data.roles);
        // Default to the first role
        setForm(prev => ({ ...prev, role_id: res.data.roles[0]?.id || '' }));
      })
      .catch(err => {
        console.error("Failed to load roles", err);
        setError('Failed to load roles.');
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.name || !form.role_id) {
      setError('All fields are required.');
      return;
    }

    try {
      await axios.post('http://localhost:3000/signup', { user: form });
      navigate('/'); // Redirect to login or dashboard
    } catch (err) {
      console.error(err);
      const messages = err.response?.data?.errors || ['Signup failed'];
      setError(messages.join(', '));
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <select
          name="role_id"
          value={form.role_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Signup
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} className="text-blue-600 underline">
          Login
        </button>
      </p>
    </div>
  );
}
