// Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './AuthStyles.module.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      localStorage.setItem('name', res.data.user.name); // ❗️ This is missing
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      if (onLoginSuccess) {
        onLoginSuccess(role); // pass role directly
      } else {
        navigate(`/${role.toLowerCase()}-dashboard`);
      }
      

    } catch (err) {
      console.error(err);
      setError('User not found. Redirecting to Signup...');
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleLogin} className={styles.form}>
    <h1>Sign in</h1>
  
    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
  
    <input
      type="email"
      name="email"
      placeholder="Email"
      required
      autoComplete="username"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={styles.input}
    />
  
    <input
      type="password"
      name="password"
      placeholder="Password"
      required
      autoComplete="current-password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className={styles.input}
    />
  
   
    <button type="submit" className={styles.button}>Sign In</button>
  </form>
  
  );
}