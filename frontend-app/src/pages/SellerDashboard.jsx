import React, { useEffect, useState, useRef, useCallback } from "react"; // Added useCallback
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaTag,
  FaUsers,
  FaRedoAlt,
  FaChartPie, // Added FaChartPie icon
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"; // Recharts imports
import styles from "./SellerDashboard.module.css";

const MAIN_TABS = ["view", "requests"];

export default function SellerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [allSellerProductsData, setAllSellerProductsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("view");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [minCostOverall, setMinCostOverall] = useState(0);
  const [maxCostOverall, setMaxCostOverall] = useState(0);
  const [currentMinCost, setCurrentMinCost] = useState(0);
  const [currentMaxCost, setCurrentMaxCost] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterWarning, setFilterWarning] = useState("");

  // Add Product form states
  const [productName, setProductName] = useState("");
  const [cost, setCost] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  // Add Category form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Profile Edit modal states
  const [showProfile, setShowProfile] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [updatedName, setUpdatedName] = useState(
    localStorage.getItem("name") || ""
  );
  const [password, setPassword] = useState("");
  const [updatedEmail, setUpdatedEmail] = useState(
    localStorage.getItem("email") || ""
  );
  const [profileWarning, setProfileWarning] = useState("");

  // Chart state
  const [showChartModal, setShowChartModal] = useState(false); // New state for chart modal visibility

  // Refs
  const profileRef = useRef();
  const editRef = useRef();
  const addProductFormRef = useRef();
  const addCategoryFormRef = useRef();
  const chartModalRef = useRef(); // Ref for chart modal

  const currentFiltersRef = useRef({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchCategories();
    fetchAllProductsForRangeAndFiltering();
    fetchRequestsAndProducts({});
    setSelectedTab("view");
  }, [token, navigate]);

  useEffect(() => {
    handleApplyFilter();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updatedProductsWithCounts = allSellerProductsData.map((prod) => ({
      ...prod,
      request_count: requests.filter((r) => r.product_id === prod.id).length,
      category_name:
        categories.find((cat) => cat.id === prod.category_id)?.name || "N/A",
    }));
    if (selectedTab === "view") {
      applyFiltersToDisplayProducts(
        currentFiltersRef.current,
        updatedProductsWithCounts
      );
    }
  }, [allSellerProductsData, requests, categories, selectedTab]);

  // --- Click Outside Handler for Modals, Profile Menu, and Chart Modal ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showProfile &&
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.profileCorner}`)
      ) {
        if (!showEditForm) {
          setShowProfile(false);
        }
      }
      if (
        showEditForm &&
        editRef.current &&
        !editRef.current.contains(event.target)
      ) {
        setShowEditForm(false);
        setPassword("");
        setProfileWarning("");
      }
      if (
        showAddProductForm &&
        addProductFormRef.current &&
        !addProductFormRef.current.contains(event.target)
      ) {
        setShowAddProductForm(false);
        setError("");
      }
      if (
        showCategoryForm &&
        addCategoryFormRef.current &&
        !addCategoryFormRef.current.contains(event.target)
      ) {
        setShowCategoryForm(false);
        setError("");
      }
      if (
        showChartModal &&
        chartModalRef.current &&
        !chartModalRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.chartIcon}`)
      ) {
        // Added chartModalRef
        setShowChartModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    showProfile,
    showEditForm,
    showAddProductForm,
    showCategoryForm,
    showChartModal,
  ]); // Added showChartModal to dependencies

  // --- API Calls ---

  const fetchAllProductsForRangeAndFiltering = async () => {
    try {
      const res = await axios.get("http://localhost:3000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllSellerProductsData(res.data);

      if (res.data.length > 0) {
        const costs = res.data.map((p) => p.cost);
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
      if (selectedTab === "view") {
        applyFiltersToDisplayProducts(currentFiltersRef.current, res.data);
      }
    } catch (err) {
      console.error("Failed to fetch all seller products for range:", err);
      setError("Failed to load product data.");
      setAllSellerProductsData([]);
      setMinCostOverall(0);
      setMaxCostOverall(0);
      setCurrentMinCost(0);
      setCurrentMaxCost(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3000/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchRequestsAndProducts = async (filters = {}) => {
    setLoading(true);
    setError("");
    try {
      const requestParams = new URLSearchParams();
      if (filters.status) {
        requestParams.append("status", filters.status);
      }
      if (filters.min_cost !== undefined && filters.max_cost !== undefined) {
        requestParams.append("min_cost", parseInt(filters.min_cost, 10));
        requestParams.append("max_cost", parseInt(filters.max_cost, 10));
      }
      if (filters.category_id) {
        requestParams.append("category_id", filters.category_id);
      }
      if (filters.start_date) {
        requestParams.append("start_date", filters.start_date);
      }
      if (filters.end_date) {
        requestParams.append("end_date", filters.end_date);
      }

      const requestRes = await axios.get(
        `http://localhost:3000/buyer_requests?${requestParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests(requestRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to load data. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToDisplayProducts = useCallback(
    (filters, productsToFilter = allSellerProductsData) => {
      let filtered = [...productsToFilter];

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
    },
    [allSellerProductsData]
  ); // Added allSellerProductsData to useCallback dependencies

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start.getTime() > end.getTime()) {
        setFilterWarning("Start date cannot be after end date. Please adjust.");
        setTimeout(() => setFilterWarning(""), 5000);
        return;
      }
    }
    setFilterWarning("");

    const filters = {};
    if (selectedStatusFilter) {
      filters.status = selectedStatusFilter;
    }
    if (
      currentMinCost !== minCostOverall ||
      currentMaxCost !== maxCostOverall
    ) {
      filters.min_cost = parseInt(currentMinCost, 10);
      filters.max_cost = parseInt(currentMaxCost, 10);
    }
    if (selectedCategoryFilter) {
      filters.category_id = selectedCategoryFilter;
    }
    if (startDate) {
      filters.start_date = startDate;
    }
    if (endDate) {
      filters.end_date = endDate;
    }

    currentFiltersRef.current = filters;

    if (selectedTab === "view") {
      applyFiltersToDisplayProducts(filters);
    } else if (selectedTab === "requests") {
      fetchRequestsAndProducts(filters);
    }
  };

  const handleResetFilter = () => {
    setSelectedStatusFilter("");
    setCurrentMinCost(minCostOverall);
    setCurrentMaxCost(maxCostOverall);
    setSelectedCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setFilterWarning("");

    const clearedFilters = {};
    currentFiltersRef.current = clearedFilters;

    if (selectedTab === "view") {
      fetchAllProductsForRangeAndFiltering();
    } else if (selectedTab === "requests") {
      fetchRequestsAndProducts({});
    }
  };

  const handleCheckboxChange = (status) => {
    setSelectedStatusFilter((prev) => (prev === status ? "" : status));
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

  // --- Profile Management ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileWarning("");

    const nameRegex = /^[A-Za-z]{3,10}$/;
    if (!nameRegex.test(updatedName)) {
      setProfileWarning("Name must be 3–10 alphabetic characters only.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (password && !passwordRegex.test(password)) {
      setProfileWarning(
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
        errorMessage +=
          " " + Object.values(err.response.data.errors).flat().join(", ");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        errorMessage += " " + err.response.data.message;
      }
      setProfileWarning(errorMessage);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  // --- Request Management ---
  const handleApproval = async (requestId, status) => {
    try {
      await axios.patch(
        `http://localhost:3000/buyer_requests/${requestId}/approve_by_seller`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequestsAndProducts(currentFiltersRef.current);
      await fetchAllProductsForRangeAndFiltering();
    } catch (err) {
      console.error(err);
      setError("Failed to update request status. Please try again.");
    }
  };

  // --- Product Management ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError("");

    const nameRegex = /^[\p{L}\s’']{4,20}$/u;
    if (!nameRegex.test(productName)) {
      setError(
        "Product name must be 4–20 alphabetic characters, spaces, or apostrophes only."
      );
      return;
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setError("Cost must be a positive number.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category for the product.");
      return;
    }
    if (!image) {
      setError("Product image is required.");
      return;
    }

    const formData = new FormData();
    formData.append("product[product_name]", productName);
    formData.append("product[cost]", parsedCost);
    formData.append("product[category_id]", categoryId);
    formData.append("product[visible]", visible);
    formData.append("product[image]", image);

    try {
      await axios.post("http://localhost:3000/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProductName("");
      setCost("");
      setCategoryId("");
      setVisible(false);
      setImage(null);
      setShowAddProductForm(false);
      alert("Product submitted for admin approval.");
      await fetchAllProductsForRangeAndFiltering();
      await fetchRequestsAndProducts({});
    } catch (err) {
      console.error(err);
      let errorMessage = "Failed to submit product.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage +=
          " " + Object.values(err.response.data.errors).flat().join(", ");
      }
      setError(errorMessage);
    }
  };

  // --- Category Management ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError("");

    if (!newCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:3000/categories",
        {
          category: { name: newCategoryName },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewCategoryName("");
      setShowCategoryForm(false);
      fetchCategories();
      alert("Category created successfully!");
    } catch (err) {
      console.error("Failed to create category", err);
      let errorMessage = "Failed to create category.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage +=
          " " + Object.values(err.response.data.errors).flat().join(", ");
      }
      setError(errorMessage);
    }
  };

  // --- Chart Data Calculation ---
  const getChartData = () => {
    if (selectedTab === "view") {
      // Data for products based on admin_status
      const pending = allSellerProductsData.filter(
        (p) => p.admin_status === "pending"
      ).length;
      const approved = allSellerProductsData.filter(
        (p) => p.admin_status === "approved"
      ).length;
      const rejected = allSellerProductsData.filter(
        (p) => p.admin_status === "rejected"
      ).length;

      return [
        { name: "Pending", value: pending },
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
      ].filter((item) => item.value > 0); // Only show categories with values > 0
    } else if (selectedTab === "requests") {
      // Data for buyer requests based on status
      const pending = requests.filter((r) => r.status === "pending").length;
      const approved = requests.filter((r) => r.status === "approved").length;
      const rejected = requests.filter((r) => r.status === "rejected").length;

      return [
        { name: "Pending", value: pending },
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
      ].filter((item) => item.value > 0);
    }
    return [];
  };

  const chartData = getChartData(); // Calculate chart data
  const COLORS = ["#FFBB28", "#00C49F", "#FF8042"]; // Colors for segments (Pending, Approved, Rejected)

  const minPercent =
    ((currentMinCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
    100;
  const maxPercent =
    ((currentMaxCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
    100;

  return (
    <div className={`${styles.container} ${styles.sideFilterOpen}`}>
      {/* Profile Icon and Menu */}
      <div className={styles.profileCorner}>
        <FaUserCircle onClick={() => setShowProfile(!showProfile)} />
        {showProfile && (
          <div ref={profileRef} className={`${styles.profileMenu} card`}>
            <div className="card-body p-2">
              <p className="card-text mb-1">
                <span className={styles.label}>Name:</span>
                <span className={styles.valueText}>
                  {localStorage.getItem("name")}
                </span>
              </p>
              <p className="card-text mb-2">
                <span className={styles.label}>Role:</span>
                <span className={styles.valueText}>{userRole}</span>
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
                onClick={logout}
                className={`${styles.logout} btn btn-sm w-100`}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Icon */}
      <div className={styles.chartIcon}>
        <FaChartPie onClick={() => setShowChartModal(!showChartModal)} />
      </div>

      {/* Edit Profile Modal */}
      {showEditForm && (
        <div className={styles.modalOverlay}>
          <div ref={editRef} className={styles.modalCard}>
            <h2 className={styles.modalTitle}>Edit Profile</h2>
            {profileWarning && (
              <div className={styles.warning}>⚠️ {profileWarning}</div>
            )}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <label>Name</label>
              <input
                type="text"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
              />
              <label>Email</label>
              <input
                type="email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
              />
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
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
                    setProfileWarning("");
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

      {/* Chart Modal */}
      {showChartModal && (
        <div className={styles.modalOverlay}>
          <div ref={chartModalRef} className={styles.chartModalCard}>
            {" "}
            {/* Use specific chart modal style */}
            <h2>
              {selectedTab === "view"
                ? "Product Status Overview"
                : "Buyer Request Status Overview"}
            </h2>
            {chartData.length === 0 ? (
              <p>No data available to display chart for current filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    } // Show name and percentage
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className={styles.modalButtons}>
              <button
                type="button"
                onClick={() => setShowChartModal(false)}
                className={styles.cancel}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={styles.title}>Seller Dashboard</h1>

      {/* Filter Sidebar - Always Open */}
      <div className={`${styles.sideFilter} ${styles.open}`}>
        <div className={styles.sideFilterHeader}>
          <h2>Filters</h2>
          <button className={styles.resetButton} onClick={handleResetFilter}>
            <FaRedoAlt /> Reset
          </button>
        </div>

        {/* Status Filter (only for Buyer Requests) */}
        {selectedTab === "requests" && (
          <div className={styles.filterSection}>
            <h3>Status (Requests)</h3>
            <div className={styles.checkboxGroup}>
              {["pending", "approved", "rejected"].map((status) => (
                <label key={status} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedStatusFilter === status}
                    onChange={() => handleCheckboxChange(status)}
                  />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter (for Products & Requests) */}
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

        {/* Category Filter (for Products & Requests) */}
        <div className={styles.filterSection}>
          <h3>Category</h3>
          <select
            className={styles.categoryDropdown}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Request Date Range Filter (only for Buyer Requests) */}
        {selectedTab === "requests" && (
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
        )}
        {filterWarning && (
          <div className={styles.warning}>⚠️ {filterWarning}</div>
        )}
        <div className={styles.filterControls}>
          <button className={styles.applyBtn} onClick={handleApplyFilter}>
            Apply Filter
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContentArea}>
        {error && !showAddProductForm && !showCategoryForm && (
          <div className={styles.warning}>⚠️ {error}</div>
        )}

        {/* Navigation Tabs */}
        <div className={styles.links}>
          <span
            className={`${styles.link} ${
              selectedTab === "view" ? styles.activeLink : ""
            }`}
            onClick={() => {
              setSelectedTab("view");
            }}
          >
            View Products
          </span>
          <span
            className={`${styles.link} ${
              selectedTab === "requests" ? styles.activeLink : ""
            }`}
            onClick={() => {
              setSelectedTab("requests");
            }}
          >
            Buyer Requests
          </span>
          <span
            className={styles.link}
            onClick={() => {
              setShowAddProductForm(true);
              setError("");
            }}
          >
            Add Product
          </span>
          <span
            className={styles.link}
            onClick={() => {
              setShowCategoryForm(true);
              setError("");
            }}
          >
            Add Category
          </span>
        </div>

        {/* Add Product Modal */}
        {showAddProductForm && (
          <div className={styles.modalOverlay}>
            <div ref={addProductFormRef} className={styles.modalCard}>
              <h2>Add Product</h2>
              {error && <p className={styles.error}>{error}</p>}
              <form onSubmit={handleAddProduct}>
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />

                <label>Cost</label>
                <input
                  type="number"
                  placeholder="Cost"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />

                <label>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <label className={styles.fileInputLabel}>
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  {image && (
                    <span className={styles.fileName}>{image.name}</span>
                  )}
                  {!image && (
                    <span className={styles.fileName}>No file chosen</span>
                  )}
                </label>

                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                  />
                  <span className={styles.checkboxCustom}></span> Enable
                  visibility
                </label>

                <div className={styles.modalButtons}>
                  <button type="submit" className={styles.submit}>
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductForm(false);
                      setError("");
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

        {/* Add Category Modal */}
        {showCategoryForm && (
          <div className={styles.modalOverlay}>
            <div ref={addCategoryFormRef} className={styles.modalCard}>
              <h2>Create Category</h2>
              {error && <p className={styles.error}>{error}</p>}
              <form onSubmit={handleAddCategory}>
                <label>Category Name</label>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className={styles.modalButtons}>
                  <button type="submit" className={styles.submit}>
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setError("");
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

        {/* Conditional Rendering based on selectedTab */}
        {selectedTab === "requests" ? (
          // Display Buyer Requests
          loading ? (
            <p className={styles.loadingMessage}>Loading buyer requests...</p>
          ) : requests.length === 0 ? (
            <div className={styles.emptyMessage}>
              <h2>No Requests Found</h2>
              <p>There are no buyer requests matching your selected filters.</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {requests.map((req) => {
                const product = allSellerProductsData.find(
                  (p) => p.id === req.product_id
                );

                if (!product) {
                  console.warn(
                    `Product with ID ${req.product_id} not found for request ${req.id}`
                  );
                  return null;
                }

                const categoryName =
                  categories.find((cat) => cat.id === product.category_id)
                    ?.name || "N/A";
                const requestDate = req.created_at
                  ? new Date(req.created_at).toLocaleDateString()
                  : "N/A";

                return (
                  <div
                    key={req.id}
                    className={`${styles.card} card shadow-sm border-0 animate__animated animate__fadeInUp`}
                  >
                    <img
                      src={
                        product.image_url ||
                        "https://placehold.co/400x200/cccccc/000000?text=No+Image"
                      }
                      className="card-img-top"
                      alt={product.product_name}
                      style={{
                        height: "200px",
                        objectFit: "cover",
                        borderTopLeftRadius: "1rem",
                        borderTopRightRadius: "1rem",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                    <div className={`${styles.cardBodyFixed} card-body`}>
                      <h5 className="card-title fw-bold">
                        {product.product_name}
                      </h5>
                      <div className="d-flex justify-content-between text-secondary small mb-2">
                        <span>
                          <FaTag className="me-1" />
                          {categoryName}
                        </span>
                        <span>
                          <FaUsers className="me-1" />
                          {allSellerProductsData.find(
                            (p) => p.id === req.product_id
                          )?.request_count || 0}{" "}
                          Requests
                        </span>
                      </div>
                      <p className="mb-1">
                        <strong>Buyer:</strong> {req.buyer_name || "N/A"}
                      </p>
                      <p className="mb-2">
                        <strong>Requested On:</strong> {requestDate}
                      </p>
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
                          <h5 className="mb-0 text-primary">₹{product.cost}</h5>
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleApproval(req.id, "approved")}
                            className={`${styles.approveBtn} btn btn-success btn-sm`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval(req.id, "rejected")}
                            className={`${styles.rejectBtn} btn btn-danger btn-sm`}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : // Displaying seller's products
        loading ? (
          <p className={styles.loadingMessage}>Loading products...</p>
        ) : products.length === 0 ? (
          <div className={styles.emptyMessage}>
            <h2>No Products Added Yet</h2>
            <p>
              Add products using the "Add Product" tab or adjust your filters.
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
                  key={product.id}
                  className={`${styles.card} card shadow-sm border-0 animate__animated animate__fadeInUp`}
                >
                  <img
                    src={
                      product.image_url ||
                      "https://placehold.co/400x200/cccccc/000000?text=No+Image"
                    }
                    className="card-img-top"
                    alt={product.product_name}
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      borderTopLeftRadius: "1rem",
                      borderTopRightRadius: "1rem",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                  <div className={`${styles.cardBodyFixed} card-body`}>
                    <h5 className="card-title fw-bold">
                      {product.product_name}
                    </h5>
                    <div className="d-flex justify-content-between text-secondary small">
                      <span>
                        <FaUsers className="me-1" />
                        {product.request_count || 0} Requests
                      </span>
                      <span>
                        <FaTag className="me-1" />
                        {categoryName}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0 text-end mb-4">
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
                        <h5 className="mb-0 text-primary">₹{product.cost}</h5>
                      </div>
                    </div>
                    {/* Optional: Add edit/delete buttons for seller's own products if needed */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
