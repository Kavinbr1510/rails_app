import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TABS = ['pending', 'approved', 'rejected'];

export default function BuyerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const token = localStorage.getItem('token');
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
    if (alreadyRequested) return;

    try {
      await axios.post('http://localhost:3000/buyer_requests', {
        buyer_request: { product_id: productId },
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRequests(); // Refresh requests list
    } catch (err) {
      console.error('Failed to send buyer request:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchRequests();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once

  const filteredRequests = requests.filter(req => req.status === selectedTab);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Buyer Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Your Requests</h2>
      <div className="flex space-x-4 mb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded ${selectedTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <ul>
        {filteredRequests.length === 0 && (
          <p className="text-gray-600 mb-4">No {selectedTab} requests found.</p>
        )}
        {filteredRequests.map(req => (
          <li key={req.id} className="mb-4 p-4 border rounded shadow">
            <p><strong>Request ID:</strong> {req.id}</p>
            <p><strong>Product ID:</strong> {req.product_id}</p>
            <p><strong>Status:</strong> {req.status}</p>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">Available Products</h2>
      <ul>
        {products.length === 0 && (
          <p className="text-gray-600">No approved products available.</p>
        )}
        {products.map(product => (
          <li key={product.id} className="mb-4 p-4 border rounded shadow">
            <p><strong>{product.product_name}</strong> - ₹{product.cost}</p>
            <button
              onClick={() => sendBuyerRequest(product.id)}
              className="bg-purple-500 text-white px-3 py-1 mt-2 rounded"
            >
              Send Request
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
