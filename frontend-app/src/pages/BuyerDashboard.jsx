import React, { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaPaperPlane,
  FaUsers,
  FaTag,
  FaRedoAlt,
} from "react-icons/fa";
import styles from "./BuyerDashboard.module.css";

const TABS = ["pending", "approved", "rejected"];

const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BuyerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [minCostOverall, setMinCostOverall] = useState(0);
  const [maxCostOverall, setMaxCostOverall] = useState(0);
  const [currentMinCost, setCurrentMinCost] = useState(0);
  const [currentMaxCost, setCurrentMaxCost] = useState(0);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [warning, setWarning] = useState("");

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  const [allProductsData, setAllProductsData] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [updatedName, setUpdatedName] = useState(name);
  const [password, setPassword] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState(
    localStorage.getItem("email") || ""
  );

  const navigate = useNavigate();

  const profileRef = useRef();
  const editRef = useRef();

  const requestedProductIds = useRef(new Set());

  useEffect(() => {
    requestedProductIds.current = new Set(requests.map((r) => r.product_id));
    applyFiltersToProducts(currentFiltersRef.current);
  }, [requests, allProductsData]);

  const currentFiltersRef = useRef({});

  const applyFiltersToProducts = (filters) => {
    let filtered = [...allProductsData];

    if (!filters.status) {
      filtered = filtered.filter((p) => !requestedProductIds.current.has(p.id));
    }

    if (filters.min_cost !== undefined && filters.max_cost !== undefined) {
      filtered = filtered.filter(
        (p) => p.cost >= filters.min_cost && p.cost <= filters.max_cost
      );
    }

    if (filters.category_id) {
      filtered = filtered.filter(
        (p) => p.category_id === Number(filters.category_id)
      );
    }
    setProducts(filtered);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        if (showProfile && !showEditForm) {
          setShowProfile(false);
        }
      }

      if (editRef.current && !editRef.current.contains(event.target)) {
        if (showEditForm) {
          setShowEditForm(false);
          setPassword("");
          setWarning("");
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile, showEditForm]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchAllProductsAndSetRange();
    fetchCategories();
    fetchRequests({});
  }, [token, navigate]);

  const fetchAllProductsAndSetRange = async () => {
    try {
      const res = await axios.get("http://localhost:3000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const approved = res.data.filter((p) => p.admin_status === "approved");
      setAllProductsData(approved);

      if (approved.length > 0) {
        const costs = approved.map((p) => p.cost);
        const minVal = Math.floor(Math.min(...costs));
        const maxVal = Math.ceil(Math.max(...costs));
        setMinCostOverall(minVal);
        setMaxCostOverall(maxVal);
        setCurrentMinCost(minVal);
        setCurrentMaxCost(maxVal);
      } else {
        setMinCostOverall(0);
        setMaxCostOverall(0);
        setCurrentMinCost(0);
        setCurrentMaxCost(0);
      }
    } catch (err) {
      console.error("Failed to fetch all products:", err);
      setAllProductsData([]);
      setProducts([]);
      setMinCostOverall(0);
      setMaxCostOverall(0);
      setCurrentMinCost(0);
      setCurrentMaxCost(0);
    }
  };

  const fetchRequests = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) {
        params.append("statuses[]", filters.status);
      }
      if (filters.min_cost !== undefined) {
        params.append("min_cost", parseInt(filters.min_cost, 10));
      }
      if (filters.max_cost !== undefined) {
        params.append("max_cost", parseInt(filters.max_cost, 10));
      }
      if (filters.category_id) {
        params.append("category_id", filters.category_id);
      }

      if (filters.start_date) {
        params.append("start_date", filters.start_date);
      }
      if (filters.end_date) {
        params.append("end_date", filters.end_date);
      }

      const url = `http://localhost:3000/buyer_requests?${params.toString()}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch buyer requests:", err);
      setRequests([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3000/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start.getTime() > end.getTime()) {
        setWarning("Start date cannot be after end date. Please adjust.");
        setTimeout(() => setWarning(""), 5000);
        return;
      }
    }

    setWarning("");

    const filters = {};
    if (selectedStatus) {
      filters.status = selectedStatus;
    }

    if (
      currentMinCost !== minCostOverall ||
      currentMaxCost !== maxCostOverall
    ) {
      filters.min_cost = parseInt(currentMinCost, 10);
      filters.max_cost = parseInt(currentMaxCost, 10);
    }

    if (selectedCategory) {
      filters.category_id = selectedCategory;
    }

    if (startDate) {
      filters.start_date = startDate;
    }
    if (endDate) {
      filters.end_date = endDate;
    }

    currentFiltersRef.current = filters;

    fetchRequests(filters);

    if (filters.status) {
      setSelectedTab(filters.status);
    } else {
      setSelectedTab(null);
    }

    applyFiltersToProducts(filters);
  };

  const handleResetFilter = () => {
    setSelectedStatus("");
    setCurrentMinCost(minCostOverall);
    setCurrentMaxCost(maxCostOverall);
    setSelectedCategory("");
    setStartDate("");
    setEndDate("");
    setSelectedTab(null);
    setWarning("");

    const clearedFilters = {};

    currentFiltersRef.current = clearedFilters;

    fetchRequests(clearedFilters);
    applyFiltersToProducts(clearedFilters);
  };

  const handleCheckboxChange = (status) => {
    setSelectedStatus((prev) => (prev === status ? "" : status));
  };

  const handleMinCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = minCostOverall;
    }
    setCurrentMinCost(value);
  };

  const handleMaxCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = maxCostOverall;
    }
    setCurrentMaxCost(value);
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
      setWarning(
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      await axios.patch(
        "http://localhost:3000/users/update_profile",
        {
          user: {
            name: updatedName,
            email: updatedEmail,
            password: password || undefined,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      localStorage.clear();
      alert("Profile updated! Please log in again.");
      navigate("/");
    } catch (err) {
      console.error("Failed to update profile:", err);

      let errorMessage = "Failed to update profile.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage += " " + err.response.data.errors.join(", ");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        errorMessage += " " + err.response.data.message;
      } else {
        errorMessage += " Please try again.";
      }
      setWarning(errorMessage);
    }
  };

  const sendBuyerRequest = async (productId) => {
    const alreadyRequested = requests.some(
      (req) => req.product_id === productId
    );
    if (alreadyRequested) {
      setWarning("You already requested this product.");
      setTimeout(() => setWarning(""), 3000);
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/buyer_requests",
        {
          buyer_request: { product_id: productId },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchRequests(currentFiltersRef.current);
    } catch (err) {
      console.error("Failed to send buyer request:", err);
      setWarning(
        "Failed to send request. Product may not be available or an error occurred."
      );
      setTimeout(() => setWarning(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getProductById = (id) => {
    const product = allProductsData.find((p) => p.id === id);
    return (
      product || {
        id: id,
        product_name: "Unknown Product",
        image_url: "/placeholder.jpg",
        cost: 0,
        request_count: 0,
        category_id: null,
        admin_status: "unknown",
      }
    );
  };

  const minPercent =
    ((currentMinCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
    100;
  const maxPercent =
    ((currentMaxCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
    100;

  return (
    <div className={`${styles.container} ${styles.sideFilterOpen}`}>
      <div className={styles.profileCorner}>
        <FaUserCircle onClick={() => setShowProfile(!showProfile)} />
        {showProfile && (
          <div ref={profileRef} className={`${styles.profileMenu} card`}>
            <div className="card-body p-2">
              <p className="card-text mb-1">
                <span className={styles.label}>Name:</span>
                <span className={styles.valueText}>{name}</span>
              </p>

              <p className="card-text mb-2">
                <span className={styles.label}>Role:</span>
                <span className={styles.valueText}>{role}</span>
              </p>

              <button
                onClick={() => {
                  setShowEditForm(true);
                  setShowProfile(false);
                }}
                className={`${styles.editBtn} btn btn-sm w-100 mb-2`}
              >
                Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className={`${styles.logout} btn btn-sm w-100`}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <h1 className={styles.title}>👋 Welcome, Your BuyerHub Awaits</h1>

      <div className={`${styles.sideFilter} ${styles.open}`}>
        <div className={styles.sideFilterHeader}>
          <h2>Filters</h2>
          <button className={styles.resetButton} onClick={handleResetFilter}>
            <FaRedoAlt /> Reset
          </button>
        </div>

        <div className={styles.filterSection}>
          <h3>Status</h3>
          <div className={styles.checkboxGroup}>
            {TABS.map((status) => (
              <label key={status} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedStatus === status}
                  onChange={() => handleCheckboxChange(status)}
                />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <h3>Price Range</h3>
          <div className={styles.priceRangeValues}>
            <span className={styles.priceValueMin}>₹{currentMinCost}</span>
            <span className={styles.priceValueMax}>₹{currentMaxCost}</span>
          </div>
          <div className={styles.rangeSliderContainer}>
            <input
              type="range"
              min={minCostOverall}
              max={maxCostOverall}
              value={currentMinCost}
              onChange={handleMinCostChange}
              className={styles.rangeSliderMin}
              style={{
                zIndex: currentMinCost > currentMaxCost ? 3 : 2,
              }}
            />
            <input
              type="range"
              min={minCostOverall}
              max={maxCostOverall}
              value={currentMaxCost}
              onChange={handleMaxCostChange}
              className={styles.rangeSliderMax}
              style={{
                zIndex: currentMaxCost < currentMinCost ? 3 : 2,
              }}
            />
            <div
              className={styles.rangeTrackFill}
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`,
              }}
            ></div>
          </div>
        </div>

        <div className={styles.filterSection}>
          <h3>Category</h3>
          <select
            className={styles.categoryDropdown}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterSection}>
          <h3>Request Date Range</h3>
          <label className={styles.dateLabel}>From:</label>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className={styles.dateLabel}>To:</label>
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className={styles.filterControls}>
          <button className={styles.applyBtn} onClick={handleApplyFilter}>
            Apply Filter
          </button>
        </div>
      </div>

      <div className={styles.mainContentArea}>
        {warning && !showEditForm && (
          <div className={styles.warning}>⚠️ {warning}</div>
        )}

        <div className={styles.mainContent}>
          {selectedTab ? (
            <div className="container mt-4">
              {requests.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <h2>
                    No{" "}
                    {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}{" "}
                    Requests
                  </h2>
                  <p>No {selectedTab} requests matching your filters.</p>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {requests.map((req) => {
                    const product = req.product
                      ? { ...req.product }
                      : getProductById(req.product_id);

                    if (selectedStatus && req.status !== selectedStatus) {
                      return null;
                    }

                    const categoryName =
                      categories.find((cat) => cat.id === product.category_id)
                        ?.name || "N/A";

                    return (
                      <div
                        className={`${styles.card} card shadow-sm border-0 animate__animated animate__fadeInUp`}
                        key={req.id}
                        style={{
                          transition: "transform 0.3s",
                          cursor: "pointer",
                        }}
                        onClick={() => {}}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <img
                          src={product.image_url || "/placeholder.jpg"}
                          className="card-img-top"
                          alt={product.product_name}
                          style={{
                            height: "200px",
                            objectFit: "cover",
                            borderTopLeftRadius: "1rem",
                            borderTopRightRadius: "1rem",
                          }}
                        />
                        <div className={`${styles.cardBodyFixed} card-body`}>
                          <h5 className="card-title fw-bold">
                            {product.product_name}
                          </h5>
                          <div className="d-flex justify-content-between text-secondary small mb-2">
                            <span>
                              <FaUsers className="me-1" />
                              {product.request_count || 0}
                            </span>
                            <span>
                              <FaTag className="me-1" />
                              {categoryName}
                            </span>
                            <span>
                              <FaPaperPlane className="me-1" />
                              Request
                            </span>
                          </div>
                        </div>
                        <div className="card-footer bg-white border-top-0 text-end">
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div>
                              <span
                                className={`badge rounded-pill ${
                                  req.status === "approved"
                                    ? "bg-success"
                                    : req.status === "pending"
                                    ? "bg-warning text-dark"
                                    : "bg-danger"
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            <div className="text-end">
                              <h5 className="mb-0 text-primary">
                                ₹{product.cost}
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="container mt-4">
              {products.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <h2>No Products Available</h2>
                  <p>
                    There are no products available for you to request that
                    match your current filters.
                    <br />
                    Try clearing filters or checking the "Requests" section.
                  </p>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {products.map((product) => {
                    const categoryName =
                      categories.find((cat) => cat.id === product.category_id)
                        ?.name || "N/A";

                    return (
                      <div
                        className={`${styles.card} card shadow-sm border-0 animate__animated animate__fadeInUp`}
                        key={product.id}
                        style={{
                          transition: "transform 0.3s",
                          cursor: "pointer",
                        }}
                        onClick={() => sendBuyerRequest(product.id)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <img
                          src={product.image_url || "/placeholder.jpg"}
                          className="card-img-top"
                          alt={product.product_name}
                          style={{
                            height: "200px",
                            objectFit: "cover",
                            borderTopLeftRadius: "1rem",
                            borderTopRightRadius: "1rem",
                          }}
                        />
                        <div className={`${styles.cardBodyFixed} card-body`}>
                          <h5 className="card-title fw-bold">
                            {product.product_name}
                          </h5>
                          <div className="d-flex justify-content-between text-secondary small mb-2">
                            <span>
                              <FaUsers className="me-1" />
                              {product.request_count || 0}
                            </span>
                            <span>
                              <FaTag className="me-1" />
                              {categories.find(
                                (cat) => cat.id === product.category_id
                              )?.name || "N/A"}
                            </span>
                            <span>
                              <FaPaperPlane
                                className="fs-3 mt-2"
                                title="Send Request"
                                style={{
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  alignSelf: "flex-end",
                                  color: "#007bff",
                                  transform: "translateY(0) scale(1)",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.transform =
                                    "translateY(-5px) scale(1.3)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform =
                                    "translateY(0) scale(1)")
                                }
                              />
                            </span>
                          </div>
                        </div>
                        <div className="card-footer bg-white border-top-0 text-end">
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div>
                              <span
                                className={`badge rounded-pill ${
                                  product.admin_status === "approved"
                                    ? "bg-success"
                                    : product.admin_status === "pending"
                                    ? "bg-warning text-dark"
                                    : "bg-danger"
                                }`}
                              >
                                {product.admin_status}
                              </span>
                            </div>
                            <div className="text-end">
                              <h5 className="mb-0 text-primary">
                                ₹{product.cost}
                              </h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditForm && (
        <div className={styles.modalOverlay}>
          <div ref={editRef} className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Edit Profile</h2>
            {warning && <div className={styles.warning}>⚠️ {warning}</div>}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <label>Name</label>
              <input
                type="text"
                value={updatedName || ""}
                onChange={(e) => setUpdatedName(e.target.value)}
                placeholder="Enter your name"
              />

              <label>Email</label>
              <input
                type="email"
                value={updatedEmail || ""}
                onChange={(e) => setUpdatedEmail(e.target.value)}
                placeholder="Enter your email"
              />

              <label>New Password</label>
              <input
                type="password"
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (leave blank to keep current)"
              />

              <div className={styles.modalButtons}>
                <button type="submit" className={styles.submit}>
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setPassword("");
                    setWarning("");
                  }}
                  className={styles.cancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
