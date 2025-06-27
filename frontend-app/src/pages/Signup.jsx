import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./AuthStyles.module.css";

export default function Signup({ onSignupSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/signup")
      .then((res) => {
        setRoles(res.data.roles);
        setForm((prev) => ({ ...prev, role_id: res.data.roles[0]?.id || "" }));
      })
      .catch((err) => {
        console.error("Failed to load roles", err);
        setErrors({ general: "Failed to load roles." });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error for the field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.email || !form.password || !form.name || !form.role_id) {
      setErrors({ general: "All fields are required." });
      return;
    }

    try {
      await axios.post("http://localhost:3000/signup", { user: form });

      setForm({
        name: "",
        email: "",
        password: "",
        role_id: roles[0]?.id || "",
      });
      setErrors({});
      onSignupSuccess();
    } catch (err) {
      console.error(err);
      const messages = err.response?.data?.errors || ["Signup failed"];
      const fieldErrors = {};

      messages.forEach((msg) => {
        if (msg.toLowerCase().includes("name")) fieldErrors.name = msg;
        else if (msg.toLowerCase().includes("email")) fieldErrors.email = msg;
        else if (msg.toLowerCase().includes("password"))
          fieldErrors.password = msg;
        else fieldErrors.general = msg;
      });

      setErrors(fieldErrors);
    }
  };

  return (
    <div>
      <form onSubmit={handleSignup} className={styles.form}>
        <h1>Create Account</h1>

        {errors.general && <div className={styles.error}>{errors.general}</div>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className={styles.input}
          required
        />
        {errors.name && <div className={styles.error}>{errors.name}</div>}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className={styles.input}
          required
        />
        {errors.email && <div className={styles.error}>{errors.email}</div>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
          required
        />
        {errors.password && (
          <div className={styles.error}>{errors.password}</div>
        )}

        <select
          name="role_id"
          value={form.role_id}
          onChange={handleChange}
          required
          className={styles.input}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <button type="submit" className={styles.button}>
          Sign Up
        </button>
      </form>
    </div>
  );
}
