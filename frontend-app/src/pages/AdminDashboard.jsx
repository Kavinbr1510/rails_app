// src/pages/AdminDashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Tabs from "../components/Tabs";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error loading products", err));
  }, []);

  const handleStatus = (id, status) => {
    API.patch(`/products/${id}/approve_by_admin`, {
      product: { admin_status: status },
    }).then(() => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, admin_status: status } : p))
      );
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderCard = (p) => (
    <div key={p.id} className={styles.card}>
      <p><strong>{p.product_name}</strong></p>
      <p>₹{p.cost}</p>
      <p>👤 Seller: <strong>{p.seller?.name || "Unknown"}</strong></p>
      {p.admin_status === "pending" && (
        <>
          <button
            onClick={() => handleStatus(p.id, "approved")}
            className={styles.approveButton}
          >
            Approve
          </button>
          <button
            onClick={() => handleStatus(p.id, "rejected")}
            className={styles.rejectButton}
          >
            Reject
          </button>
        </>
      )}
    </div>
  );
  

  const tabs = {
    "Pending Requests": products
      .filter((p) => p.admin_status === "pending")
      .map(renderCard),

    Approved: products
      .filter((p) => p.admin_status === "approved")
      .map(renderCard),

    Rejected: products
      .filter((p) => p.admin_status === "rejected")
      .map(renderCard),
  };

  return (
    <div className={styles.container}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={styles.title}>Admin Dashboard</h1>
        <button onClick={handleLogout} className={styles.logout}>
          Logout
        </button>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
