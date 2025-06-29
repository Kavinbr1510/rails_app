// Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast
import styles from "./AuthStyles.module.css";
import { useAuth } from "../auth/AuthContext";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Keeping this for internal form validation, but toast will handle server errors.
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous form validation error

    if (!email || !password) {
      setError("Email and password are required.");
      toast.error("Email and password are required."); // Display toast error
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });
      console.log(res.data);
      const name = res.data.user.name;
      const token = res.data.token;
      const role = res.data.user.role;
      const userEmail = res.data.user.email;

      localStorage.setItem("name", name);
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", userEmail);

      login(token);

      // Display success toast
      toast.success(`Welcome back, ${name}!`);

      if (onLoginSuccess) {
        onLoginSuccess(role);
      } else {
        navigate(`/${role.toLowerCase()}-dashboard`);
      }

      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      // Display error toast for server errors
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
      navigate("/"); // Still navigate to home on error, as per original logic
    }
  };

  return (
    <form onSubmit={handleLogin} className={styles.form}>
      <h1>Sign in</h1>

      {/* You can keep this for immediate validation feedback if you like,
          but the toast will provide a more prominent notification. */}
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}

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

      <button type="submit" className={styles.button}>
        Sign In
      </button>
    </form>
  );
}