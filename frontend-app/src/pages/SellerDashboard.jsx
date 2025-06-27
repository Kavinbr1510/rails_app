// Updated SellerDashboard.jsx with profile menu and edit modal
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import styles from './SellerDashboard.module.css';

const TABS = ['pending', 'approved', 'rejected', 'view'];

export default function SellerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
  const [cost, setCost] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showProfile, setShowProfile] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [updatedName, setUpdatedName] = useState(localStorage.getItem('name') || '');
  const [password, setPassword] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState(localStorage.getItem('email') || '');
  const [warning, setWarning] = useState('');

  const profileRef = useRef();
  const editRef = useRef();

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchCategories();
    fetchAllData();
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (showProfile && profileRef.current && !profileRef.current.contains(event.target) && !showEditForm) {
        setShowProfile(false);
      }
      if (showEditForm && editRef.current && !editRef.current.contains(event.target)) {
        setShowEditForm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile, showEditForm]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:3000/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [requestRes, productRes] = await Promise.all([
        axios.get('http://localhost:3000/buyer_requests', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:3000/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const reqs = requestRes.data;
      const prods = productRes.data.map(prod => ({
        ...prod,
        request_count: reqs.filter(r => r.product_id === prod.id).length,
        category_name: prod.category?.name || 'Unknown',
      }));
      setRequests(reqs);
      setProducts(prods);
    } catch (err) {
      console.error('Error fetching data', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const nameRegex = /^[A-Za-z]{3,10}$/;
    if (!nameRegex.test(updatedName)) {
      setWarning("Name must be 3–10 alphabetic characters only.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (password && !passwordRegex.test(password)) {
      setWarning("Password must be at least 6 characters and include uppercase, lowercase, number, and special character.");
      return;
    }
    try {
      await axios.patch('http://localhost:3000/users/update_profile', {
        user: {
          name: updatedName,
          email: updatedEmail,
          password,
        },
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      alert("Profile updated! Please log in again.");
      navigate('/');
    } catch (err) {
      console.error("Failed to update profile:", err);
      setWarning("Failed to update profile.");
    }
  };

  const handleApproval = async (requestId, status) => {
    try {
      await axios.patch(
        `http://localhost:3000/buyer_requests/${requestId}/approve_by_seller`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAllData();
    } catch (err) {
      console.error(err);
      setError('Failed to update request status.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    const nameRegex = /^[\p{L}\s’']{4,20}$/u;

if (!nameRegex.test(productName)) {
  setError('Product name must be 4–20 alphabetic characters and spaces/apostrophes only.');
  return;
}

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setError('Cost must be a number greater than 0.');
      return;
    }
    const formData = new FormData();
    formData.append('product[product_name]', productName);
    formData.append('product[cost]', parsedCost);
    formData.append('product[category_id]', categoryId);
    formData.append('product[visible]', visible);
    if (image) formData.append('product[image]', image);
    try {
      await axios.post('http://localhost:3000/products', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProductName('');
      setCost('');
      setCategoryId('');
      setVisible(false);
      setImage(null);
      setShowForm(false);
      alert('Product submitted for admin approval.');
      await fetchAllData();
    } catch (err) {
      console.error(err);
      setError('Failed to submit product.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await axios.post('http://localhost:3000/categories', {
        category: { name: newCategoryName },
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewCategoryName('');
      setShowCategoryForm(false);
      fetchCategories();
    } catch (err) {
      console.error("Failed to create category", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredRequests = requests.filter((req) => req.status === selectedTab);

  return (
    <div className={styles.container}>
    <div className={styles.profileCorner}>
      <FaUserCircle onClick={() => setShowProfile(!showProfile)} />
      {showProfile && (
        <div ref={profileRef} className={styles.profileMenu}>
          <p><strong>Name:</strong> {localStorage.getItem('name')}</p>
          <p><strong>Role:</strong> Seller</p>
          <button onClick={() => setShowEditForm(true)} className={styles.editBtn}>Edit Profile</button>
          <button onClick={logout} className={styles.logout}>Logout</button>
        </div>
      )}
    </div>


    {showEditForm && (
        <div className={styles.modalOverlay}>
          <div ref={editRef} className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Edit Profile</h2>
            {warning && <div className={styles.warning}>⚠️ {warning}</div>}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <label>Name</label>
              <input type="text" value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} />
              <label>Email</label>
              <input type="email" value={updatedEmail} onChange={(e) => setUpdatedEmail(e.target.value)} />
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submit}>Update</button>
                <button type="button" onClick={() => setShowEditForm(false)} className={styles.cancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h1 className={styles.title}>🍭️ Seller Dashboard</h1>

      <div className={styles.links}>
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`${styles.link} ${selectedTab === tab ? styles.activeLink : ''}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </span>
        ))}
        <span className={styles.link} onClick={() => setShowForm(true)}>Add Product</span>
        <span className={styles.link} onClick={() => setShowCategoryForm(true)}>Add Category</span>
      </div>

      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2>Add Product</h2>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleAddProduct}>
              <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              <input type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(e.target.value)} />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
              <label>
                <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Enable visibility
              </label>
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submit}>Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2>Create Category</h2>
            <form onSubmit={handleAddCategory}>
              <input type="text" placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submit}>Create</button>
                <button type="button" onClick={() => setShowCategoryForm(false)} className={styles.cancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTab === 'view' ? (
        <div className={styles.cardGrid}>
          {products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <img
                src={product.image_url}
                alt={product.product_name}
                className={styles.productImage}
              />
              <div className={styles.productDetails}>
                <h3 className={styles.productTitle}>{product.product_name}</h3>
                <p className={styles.productCost}>₹{product.cost}</p>
                <p><strong>Category:</strong> {product.category_name}</p>
                <p><strong>Status:</strong> {product.admin_status}</p>
                <p><strong>Requests:</strong> {product.request_count}</p>
              </div>
            </div>
          ))}
        </div>
      ) : loading ? (
        <p>Loading buyer requests...</p>
      ) : (
        <div className={styles.cardGrid}>
          {filteredRequests.length === 0 ? (
            <p>No requests in this tab.</p>
          ) : (
            filteredRequests.map((req) => {
              const product = products.find(p => p.id === req.product_id);
            
              return (
                <div key={req.id} className={styles.card}>
                  {product && (
                    <>
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className={styles.productImage}
                      />
                      <p><strong>Product:</strong> {product.product_name}</p>
                      <p><strong>Category:</strong> {product.category_name}</p>
                      <p><strong>Cost:</strong> ₹{product.cost}</p>
                    </>
                  )}
                  <p><strong>Buyer:</strong> {req.buyer_name}</p>
                  <p><strong>Status:</strong> {req.status}</p>
                  {selectedTab === 'pending' && (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleApproval(req.id, 'approved')}
                        className={styles.approve}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(req.id, 'rejected')}
                        className={styles.reject}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
            
          )}
        </div>
      )}
    </div>
  );
}
