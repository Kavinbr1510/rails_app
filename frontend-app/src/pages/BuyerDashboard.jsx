import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaPaperPlane } from 'react-icons/fa';
import styles from './BuyerDashboard.module.css';

const TABS = ['pending', 'approved', 'rejected'];

export default function BuyerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null); // null = available products
  const [showProfile, setShowProfile] = useState(false);
  const [warning, setWarning] = useState('');
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3000/buyer_requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch buyer requests:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const approved = res.data.filter(p => p.admin_status === 'approved');
      setProducts(approved);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const sendBuyerRequest = async (productId) => {
    const alreadyRequested = requests.some(req => req.product_id === productId);
    if (alreadyRequested) {
      setWarning('You already requested this product.');
      setTimeout(() => setWarning(''), 3000);
      return;
    }

    try {
      await axios.post('http://localhost:3000/buyer_requests', {
        buyer_request: { product_id: productId },
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to send buyer request:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchRequests();
    fetchProducts();
  }, []);

  const filteredRequests = selectedTab
    ? requests.filter(req => req.status === selectedTab)
    : [];

  const getProductById = (id) => products.find(p => p.id === id) || {};
  const requestedProductIds = new Set(requests.map(r => r.product_id));
  const availableProducts = products.filter(p => !requestedProductIds.has(p.id));

  return (
    <div className={styles.container}>
      {/* Profile Icon */}
      <div className={styles.profileCorner}>
        <FaUserCircle onClick={() => setShowProfile(!showProfile)} />
        {showProfile && (
  <div className={styles.profileMenu}>
    <p><strong>Role:</strong> {role}</p>
    <button onClick={handleLogout} className={styles.logout}>
      Logout
    </button>
  </div>
)}

      </div>

      {/* Header */}
      <h1 className={styles.title}>👋 Welcome, {name}! Your BuyerHub Awaits</h1>


      {/* Navigation Tabs */}
      <div className={styles.links}>
        {TABS.map(tab => (
          <span
            key={tab}
            className={`${styles.link} ${selectedTab === tab ? styles.activeLink : ''}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </span>
        ))}
        <span
          className={`${styles.link} ${selectedTab === null ? styles.activeLink : ''}`}
          onClick={() => setSelectedTab(null)}
        >
          Products
        </span>
      </div>

      {warning && <div className={styles.warning}>⚠️ {warning}</div>}

      {/* Show Requests or Available Products */}
      {selectedTab ? (
        <>
          {/* <h2 className={styles.sectionTitle}>{selectedTab} Requests</h2> */}
          <div className={styles.cardGrid}>
            {filteredRequests.length === 0 ? (
              <p>No {selectedTab} requests found.</p>
            ) : (
              filteredRequests.map(req => {
                const product = getProductById(req.product_id);
                return (
                  <div key={req.id} className={styles.card}>
                    <p><strong>{product.product_name || 'Unknown Product'}</strong></p>
                    <p>₹{product.cost}</p>
                    <p>Status: <strong>{req.status}</strong></p>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* <h2 className={styles.sectionTitle}>Available Products</h2> */}
          <div className={styles.cardGrid}>
            {availableProducts.length === 0 ? (
              <p>No approved products available.</p>
            ) : (
              availableProducts.map(product => (
                <div
                  key={product.id}
                  className={styles.card}
                  onClick={() => sendBuyerRequest(product.id)}
                >
                  <p><strong>{product.product_name}</strong></p>
                  <p>₹{product.cost}</p>
                  <FaPaperPlane className={styles.sendIcon} />
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
