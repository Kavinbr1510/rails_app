import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TABS = ['pending', 'approved', 'rejected'];

export default function SellerDashboard() {
  const [requests, setRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
const [cost, setCost] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch all buyer requests for this seller
  useEffect(() => {
    fetchRequests();
  }, []);

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

  const handleApproval = async (requestId, status) => {
    try {
      await axios.patch(
        `http://localhost:3000/buyer_requests/${requestId}/approve_by_seller`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setProductName('');
    setCost('');
    alert('Product submitted for admin approval.');
  } catch (err) {
    console.error(err);
    setError('Failed to submit product.');
  }
};


  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filteredRequests = requests.filter((req) => req.status === selectedTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded ${
              selectedTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleAddProduct} className="mb-8 border p-4 rounded shadow bg-gray-50">
  <h2 className="text-lg font-semibold mb-2">Add New Product</h2>
  {error && <p className="text-red-500 mb-2">{error}</p>}

  <input
    type="text"
    placeholder="Product Name"
    value={productName}
    onChange={(e) => setProductName(e.target.value)}
    className="w-full mb-2 p-2 border rounded"
  />

  <input
    type="number"
    placeholder="Cost"
    value={cost}
    onChange={(e) => setCost(e.target.value)}
    className="w-full mb-2 p-2 border rounded"
  />

  <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
    Submit Product
  </button>
</form>


      {/* Buyer Requests */}
      {loading ? (
        <p>Loading buyer requests...</p>
      ) : (
        <>
          <ul>
            {filteredRequests.map((req) => (
              <li key={req.id} className="mb-4 p-4 border rounded shadow">
                <p>
                  <strong>Request ID:</strong> {req.id}
                </p>
                <p>
                  <strong>Product ID:</strong> {req.product_id}
                </p>
                <p>
                  <strong>Buyer ID:</strong> {req.buyer_id}
                </p>
                <p>
                  <strong>Status:</strong> {req.status}
                </p>

                {selectedTab === 'pending' && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleApproval(req.id, 'approved')}
                      className="bg-green-500 text-white px-3 py-1 mr-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(req.id, 'rejected')}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {filteredRequests.length === 0 && (
            <p className="mt-4 text-gray-500">No requests in this tab.</p>
          )}
        </>
      )}
    </div>
  );
}
