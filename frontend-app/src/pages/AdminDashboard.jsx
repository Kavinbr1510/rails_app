import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Tabs from "../components/Tabs";

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
    navigate("/login");
  };

  const tabs = {
    "Pending Requests": products
      .filter((p) => p.admin_status === "pending")
      .map((p) => (
        <div key={p.id} className="mb-4 p-2 border rounded">
          <p>
            {p.product_name} - ₹{p.cost}
          </p>
          <button
            onClick={() => handleStatus(p.id, "approved")}
            className="bg-green-500 text-white px-2 py-1 mr-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => handleStatus(p.id, "rejected")}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Reject
          </button>
        </div>
      )),

    Approved: products
      .filter((p) => p.admin_status === "approved")
      .map((p) => <div key={p.id}>{p.product_name}</div>),

    Rejected: products
      .filter((p) => p.admin_status === "rejected")
      .map((p) => <div key={p.id}>{p.product_name}</div>),
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    
      <Tabs tabs={tabs} />
    </div>
  );
}
