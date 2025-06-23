import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './SellerDashboard.module.css';

const TABS = ['pending', 'approved', 'rejected'];

export default function SellerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
  const [cost, setCost] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/');
    fetchRequests();
    fetchProducts();
  }, [token]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/buyer_requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load buyer requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproval = async (requestId, status) => {
    try {
      await axios.patch(
        `http://localhost:3000/buyer_requests/${requestId}/approve_by_seller`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      console.error(err);
      setError('Failed to update request status.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    if (!productName || !cost) {
      setError('Please provide product name and cost.');
      return;
    }
    try {
      await axios.post(
        'http://localhost:3000/products',
        {
          product: {
            product_name: productName,
            cost: parseFloat(cost),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProductName('');
      setCost('');
      setShowForm(false);
      alert('Product submitted for admin approval.');
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Failed to submit product.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const getProductName = (id) => {
    const product = products.find(p => p.id === id);
    return product ? product.product_name : 'Unknown Product';
  };

  const filteredRequests = requests.filter((req) => req.status === selectedTab);

  return (
    <div className={styles.container}>
      <div className={styles.profileCorner}>
        <button onClick={logout} className={styles.logout}>Logout</button>
      </div>

      <h1 className={styles.title}>🍭️ Seller Dashboard</h1>

      <div className={styles.links}>
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`${styles.link} ${selectedTab === tab ? styles.activeLink : ''}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </span>
        ))}
        <span className={styles.link} onClick={() => setShowForm(true)}>
          Add Product
        </span>
      </div>

      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2>Add Product</h2>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Cost"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submit}>Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading buyer requests...</p>
      ) : (
        <div className={styles.cardGrid}>
          {filteredRequests.length === 0 ? (
            <p>No requests in this tab.</p>
          ) : (
            filteredRequests.map((req) => (
              <div key={req.id} className={styles.card}>
                <p><strong>Product:</strong> {getProductName(req.product_id)}</p>
                <p><strong>Buyer:</strong> {req.buyer_name}</p>
                <p><strong>Status:</strong> {req.status}</p>
                {selectedTab === 'pending' && (
                  <div className={styles.actionButtons}>
                    <button onClick={() => handleApproval(req.id, 'approved')} className={styles.approve}>Approve</button>
                    <button onClick={() => handleApproval(req.id, 'rejected')} className={styles.reject}>Reject</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
