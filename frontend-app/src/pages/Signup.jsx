import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './AuthStyles.module.css';

export default function Signup({ onSignupSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3000/signup')
      .then(res => {
        setRoles(res.data.roles);
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
      onSignupSuccess();
    } catch (err) {
      console.error(err);
      const messages = err.response?.data?.errors || ['Signup failed'];
      setError(messages.join(', '));
    }
  };

  return (
    <div >
      <form onSubmit={handleSignup}  className={styles.form}>
        <h1>Create Account</h1>

        {error && <div >{error}</div>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className={styles.input}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className={styles.input}
          required
          
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
          required
          
        />
        <select
          name="role_id"
          value={form.role_id}
          onChange={handleChange}
          required
          
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <button type="submit" className={styles.button}>Sign Up</button>
      </form>
    </div>
  );
}