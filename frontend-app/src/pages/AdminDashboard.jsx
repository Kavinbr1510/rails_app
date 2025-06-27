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
      .then((res) => {
        setProducts(res.data);
        console.log("Admin Dashboard: Initial products fetched:", res.data); //
      })
      .catch((err) => console.error("Error loading products for Admin", err)); //
  }, []);

  const handleStatus = (id, status) => {
    console.log(`Admin action: Attempting to set product ID ${id} to status: ${status}`); //
    API.patch(`/products/${id}/approve_by_admin`, {
      product: { admin_status: status },
    })
      .then((res) => {
        const updatedProduct = res.data.product; //
        console.log(`Product ID ${id} successfully updated to ${updatedProduct.admin_status}. Backend Response Product:`, updatedProduct); //

        setProducts((prev) => {
          const newState = prev.map((p) => //
            p.id === updatedProduct.id ? updatedProduct : p //
          );
          console.log("Admin Dashboard: New 'products' state after update:", newState); //
          const productInNewState = newState.find(p => p.id === updatedProduct.id); //
          console.log(`Admin Dashboard: Product ID ${updatedProduct.id} in new state has admin_status:`, productInNewState ? productInNewState.admin_status : 'Not found'); //
          return newState; //
        });
      })
      .catch((err) => {
        console.error(`Error updating product status for ID ${id}:`, err); //
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); //
    navigate("/"); //
  };

  const renderCard = (p) => (
    <div key={p.id} className={styles.card}> {/* */}
      <p><strong>{p.product_name}</strong></p> {/* */}
      <p>₹{p.cost}</p> {/* */}
      <p>👤 Seller: <strong>{p.seller?.name || "Unknown"}</strong></p> {/* */}
      {/* Display current admin status */}
      <p>Status: <span
        className={`${styles.statusBadge} ${
          p.admin_status === "approved"
            ? styles.statusApproved
            : p.admin_status === "pending"
            ? styles.statusPending
            : styles.statusRejected
        }`}
      >
        {p.admin_status.charAt(0).toUpperCase() + p.admin_status.slice(1)} {/* */}
      </span></p>

      {/* Action buttons only for 'pending' status */}
      {p.admin_status === "pending" && ( //
        <>
          <button
            onClick={() => handleStatus(p.id, "approved")} //
            className={styles.approveButton} //
          >
            Approve
          </button>
          <button
            onClick={() => handleStatus(p.id, "rejected")} //
            className={styles.rejectButton} //
          >
            Reject
          </button>
        </>
      )}
      {/* Allow re-approving a rejected product or re-rejecting an approved one */}
      {p.admin_status === "rejected" && ( //
        <button
          onClick={() => handleStatus(p.id, "approved")} //
          className={styles.approveButton} //
        >
          Re-Approve
        </button>
      )}
      {p.admin_status === "approved" && ( //
        <button
          onClick={() => handleStatus(p.id, "rejected")} //
          className={styles.rejectButton} //
        >
          Re-Reject
        </button>
      )}
    </div>
  );

  const tabs = {
    "Pending Requests": products //
      .filter((p) => p.admin_status === "pending") //
      .map(renderCard), //

    Approved: products //
      .filter((p) => p.admin_status === "approved") //
      .map(renderCard), //

    Rejected: products //
      .filter((p) => p.admin_status === "rejected") //
      .map(renderCard), //
  };

  return (
    <div className={styles.container}> {/* */}
      <div className="flex justify-between items-center mb-6"> {/* */}
        <h1 className={styles.title}>Admin Dashboard</h1> {/* */}
        <button onClick={handleLogout} className={styles.logout}> {/* */}
          Logout
        </button>
      </div>

      <Tabs tabs={tabs} /> {/* */}
    </div>
  );
}