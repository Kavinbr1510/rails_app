import React, { useEffect, useState, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaTag,
  FaUsers,
  FaRedoAlt,
  FaChartPie,
  FaEdit,
  FaSignOutAlt,
  FaFilter,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./SellerDashboard.module.css";
import { toast } from "react-toastify";

export default function SellerDashboard() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]); // This will hold the filtered products for 'view' tab
  const [allSellerProductsData, setAllSellerProductsData] = useState([]); // Raw product data
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
  const [showChartModal, setShowChartModal] = useState(false);

  // Refs
  const profileRef = useRef();
  const editRef = useRef();
  const addProductFormRef = useRef();
  const addCategoryFormRef = useRef();
  const chartModalRef = useRef();

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // --- API Calls (defined as Callbacks) ---

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:3000/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      toast.error("Failed to load categories.");
      setCategories([]);
    }
  }, [token]);

  const fetchAllProductsAndSetRange = useCallback(async () => {
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
    } catch (err) {
      console.error("Failed to fetch all seller products for range:", err);
      toast.error("Failed to load product data.");
      setAllSellerProductsData([]);
      setMinCostOverall(0);
      setMaxCostOverall(0);
      setCurrentMinCost(0);
      setCurrentMaxCost(0);
    }
  }, [token]);


  const fetchBuyerRequests = useCallback(async (filters) => {
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
      console.error("Error fetching buyer requests:", err);
      toast.error("Failed to load buyer requests. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // --- Filtering Logic as Callbacks ---

  const applyFiltersToProductsDisplay = useCallback(
    (productsToFilter) => {
      setLoading(true); // Start loading for product display
      let filtered = [...productsToFilter];

      // Enrich products with request_count and category_name *before* filtering
      const enrichedProducts = filtered.map((prod) => ({
        ...prod,
        request_count: requests.filter((r) => r.product_id === prod.id).length,
        category_name:
          categories.find((cat) => cat.id === prod.category_id)?.name || "N/A",
      }));

      // Apply price filter
      if (currentMinCost >= minCostOverall && currentMaxCost <= maxCostOverall) {
        filtered = enrichedProducts.filter(
          (p) => p.cost >= currentMinCost && p.cost <= currentMaxCost
        );
      } else {
        filtered = enrichedProducts; // If no valid range, use all enriched products
      }

      // Apply category filter
      if (selectedCategoryFilter) {
        filtered = filtered.filter(
          (p) => p.category_id === Number(selectedCategoryFilter)
        );
      }

      setProducts(filtered);
      setLoading(false); // End loading for product display
    },
    [
      currentMinCost,
      currentMaxCost,
      selectedCategoryFilter,
      minCostOverall,
      maxCostOverall,
      requests, // Include requests so product request counts update
      categories, // Include categories so product category names update
    ]
  );


  // --- Initial Data Fetching ---
  // This useEffect only fetches base data that doesn't depend on tab selection initially.
  useEffect(() => {
    if (!token) {
      navigate("/");
      toast.error("You are not authorized. Please log in.");
      return;
    }

    const loadInitialData = async () => {
      setLoading(true); // Set loading while fetching ALL initial data
      try {
        await Promise.all([
          fetchCategories(),
          fetchAllProductsAndSetRange(),
        ]);
        // Don't call applyFiltersToProductsDisplay or fetchBuyerRequests here.
        // The separate `useEffect`s will handle initial filtering/fetching based on `selectedTab`.
      } catch (err) {
        console.error("Initial data load failed:", err);
        setError("Failed to load dashboard data.");
      } finally {
        // No setLoading(false) here, as `handleTabChange` or the specific
        // filter/fetch useEffects will manage the loading state for the *displayed* data.
      }
    };

    loadInitialData();
  }, [token, navigate, fetchCategories, fetchAllProductsAndSetRange]);


  // --- Auto-filtering for "View Products" tab ---
  useEffect(() => {
    if (selectedTab === "view" && allSellerProductsData.length > 0) {
      applyFiltersToProductsDisplay(allSellerProductsData);
    } else if (selectedTab === "view" && !loading) {
        // If no products available and not loading anymore, set products to empty
        setProducts([]);
    }
  }, [
    selectedTab,
    currentMinCost,
    currentMaxCost,
    selectedCategoryFilter,
    allSellerProductsData, // When the raw data changes, re-apply filters
    applyFiltersToProductsDisplay, // The useCallback itself
  ]);

  // --- Auto-fetching for "Buyer Requests" tab ---
  useEffect(() => {
    if (selectedTab === "requests") {
      const filters = {
        status: selectedStatusFilter,
        min_cost: currentMinCost,
        max_cost: currentMaxCost,
        category_id: selectedCategoryFilter,
        start_date: startDate,
        end_date: endDate,
      };
      fetchBuyerRequests(filters);
    } else if (selectedTab === "view" && !loading) {
        // When switching *from* requests to view, ensure requests are cleared and not loading
        setRequests([]);
    }
  }, [
    selectedTab,
    selectedStatusFilter,
    currentMinCost,
    currentMaxCost,
    selectedCategoryFilter,
    startDate,
    endDate,
    fetchBuyerRequests, // The useCallback itself
  ]);


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
        setUpdatedName(localStorage.getItem("name") || "");
        setUpdatedEmail(localStorage.getItem("email") || "");
      }
      if (
        showAddProductForm &&
        addProductFormRef.current &&
        !addProductFormRef.current.contains(event.target)
      ) {
        setShowAddProductForm(false);
        setError("");
        setProductName("");
        setCost("");
        setCategoryId("");
        setVisible(false);
        setImage(null);
      }
      if (
        showCategoryForm &&
        addCategoryFormRef.current &&
        !addCategoryFormRef.current.contains(event.target)
      ) {
        setShowCategoryForm(false);
        setError("");
        setNewCategoryName("");
      }
      if (
        showChartModal &&
        chartModalRef.current &&
        !chartModalRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.chartIcon}`)
      ) {
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
  ]);


  const handleResetFilter = () => {
    setSelectedStatusFilter("");
    setCurrentMinCost(minCostOverall);
    setCurrentMaxCost(maxCostOverall);
    setSelectedCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setFilterWarning("");
    toast.info("Filters reset!");
  };

  const handleCheckboxChange = (status) => {
    setSelectedStatusFilter((prev) => (prev === status ? "" : status));
  };

  const handleMinCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = minCostOverall;
    setCurrentMinCost(Math.min(value, currentMaxCost)); // Ensure min doesn't exceed max
  };

  const handleMaxCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = maxCostOverall;
    setCurrentMaxCost(Math.max(value, currentMinCost)); // Ensure max doesn't go below min
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.((com|in))$/;
    if (!updatedEmail) {
      setProfileWarning("Email address cannot be empty.");
      return;
    }
    if (!emailRegex.test(updatedEmail)) {
      setProfileWarning(
        "Please enter a valid email address ending with .com or .in."
      );
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
      toast.success("Profile updated! Please log in again.");
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
      toast.error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.clear();
    toast.info("You have been logged out.");
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
      toast.success(`Request ${status} successfully!`);
      // Re-fetch all products for updated request counts, and then refetch requests
      // The useEffects will automatically re-apply filters based on the new data
      await Promise.all([
        fetchAllProductsAndSetRange(),
        fetchBuyerRequests({
          status: selectedStatusFilter,
          min_cost: currentMinCost,
          max_cost: currentMaxCost,
          category_id: selectedCategoryFilter,
          start_date: startDate,
          end_date: endDate,
        })
      ]);
    } catch (err) {
      console.error(err);
      let errorMessage = "Failed to update request status. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
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
      toast.success("Product submitted for admin approval.");
      // Re-fetch all products after adding one, and requests.
      // The auto-filter useEffect will then re-apply filters based on the updated data.
      await Promise.all([
        fetchAllProductsAndSetRange(),
        fetchBuyerRequests({
          status: selectedStatusFilter,
          min_cost: currentMinCost,
          max_cost: currentMaxCost,
          category_id: selectedCategoryFilter,
          start_date: startDate,
          end_date: endDate,
        })
      ]);
    } catch (err) {
      console.error(err);
      let errorMessage = "Failed to submit product.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage +=
          " " + Object.values(err.response.data.errors).flat().join(", ");
      }
      setError(errorMessage);
      toast.error(errorMessage);
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
      fetchCategories(); // Re-fetch categories to update the list
      toast.success("Category created successfully!");
    } catch (err) {
      console.error("Failed to create category", err);
      let errorMessage = "Failed to create category.";
      if (err.response && err.response.data && err.response.data.errors) {
        errorMessage +=
          " " + Object.values(err.response.data.errors).flat().join(", ");
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // --- Chart Data Calculation ---
  const getChartData = useCallback(() => {
    if (selectedTab === "view") {
      const pending = allSellerProductsData.filter(
        (p) => p.admin_status === "pending"
      ).length;
      const approved = allSellerProductsData.filter(
        (p) => p.admin_status === "approved"
      ).length;
      const rejected = allSellerProductsData.filter(
        (p) => p.admin_status === "rejected"
      ).length;

      const data = [
        { name: "Pending", value: pending },
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
      ].filter((item) => item.value > 0); // Only include if value > 0
      console.log("Product Chart Data:", data); // Debugging line
      return data;
    } else if (selectedTab === "requests") {
      const pending = requests.filter((r) => r.status === "pending").length;
      const approved = requests.filter((r) => r.status === "approved").length;
      const rejected = requests.filter((r) => r.status === "rejected").length;

      const data = [
        { name: "Pending", value: pending },
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
      ].filter((item) => item.value > 0); // Only include if value > 0
      console.log("Request Chart Data:", data); // Debugging line
      return data;
    }
    return [];
  }, [selectedTab, allSellerProductsData, requests]);

  const chartData = getChartData();
  const COLORS = ["#FFBB28", "#00C49F", "#FF8042"];

  const minPercent =
    maxCostOverall === minCostOverall
      ? 0
      : ((currentMinCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
        100;
  const maxPercent =
    maxCostOverall === minCostOverall
      ? 100
      : ((currentMaxCost - minCostOverall) / (maxCostOverall - minCostOverall)) *
        100;

  return (
    <div className={`${styles.container} ${styles.sideFilterOpen}`}>
      {/* Fixed Top Header (new container) */}
      <div className={styles.topFixedHeader}>
        <h1 className={styles.title}>👋 Welcome, Your SellerHub Awaits</h1>
        {/* Profile Corner moved inside this new fixed header */}
        <div className={styles.profileCorner}>
          <FaUserCircle onClick={() => setShowProfile(!showProfile)} />
          {showProfile && (
            <div ref={profileRef} className={`${styles.profileMenu} card`}>
              <div className="card-body p-2">
                <p className="card-text mb-1">
                  <span className={styles.label}>Name:</span>{" "}
                  <span className={styles.valueText}>
                    {localStorage.getItem("name")}
                  </span>
                </p>
                <p className="card-text mb-2">
                  <span className={styles.label}>Role:</span>{" "}
                  <span className={styles.valueText}>{userRole}</span>
                </p>
                <div className="d-flex justify-content-between mb-2">
                  <button
                    onClick={() => {
                      setShowEditForm(true);
                      setShowProfile(false);
                      setProfileWarning("");
                      setUpdatedName(localStorage.getItem("name") || "");
                      setUpdatedEmail(localStorage.getItem("email") || "");
                    }}
                    className={`${styles.editBtn} btn btn-sm flex-fill me-2`}
                    title="Edit Profile"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={logout}
                    className={`${styles.logout} btn btn-sm flex-fill`}
                    title="Logout"
                  >
                    <FaSignOutAlt />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Icon moved next to profile corner */}
        <div className={styles.chartIcon}>
          <FaChartPie onClick={() => setShowChartModal(!showChartModal)} />
        </div>
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
                    setUpdatedName(localStorage.getItem("name") || "");
                    setUpdatedEmail(localStorage.getItem("email") || "");
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
            <h2>
              {selectedTab === "view"
                ? "Product Status Overview"
                : "Buyer Request Status Overview"}
            </h2>
            {chartData.length === 0 ? (
              <p className={styles.emptyChartMessage}>
                No data available to display chart for current filters.
              </p>
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
                    }
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

      {/* Filter Sidebar - Always Open */}
      <div className={`${styles.sideFilter} ${styles.sideFilterOpen}`}>
        <div className={styles.sideFilterHeader}>
          <h2>
            <FaFilter />
          </h2>
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
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContentArea}>
        {error &&
          !showAddProductForm &&
          !showCategoryForm &&
          !showEditForm && (
            <div className={styles.warning}>⚠️ {error}</div>
          )}

        {/* Navigation Tabs */}
        <div className={styles.links}>
          <span
            className={`${styles.link} ${
              selectedTab === "view" ? styles.activeLink : ""
            }`}
            onClick={() => setSelectedTab("view")} // Just set the tab, useEffects will handle loading/filtering
          >
            View Products
          </span>
          <span
            className={`${styles.link} ${
              selectedTab === "requests" ? styles.activeLink : ""
            }`}
            onClick={() => setSelectedTab("requests")} // Just set the tab, useEffects will handle loading/filtering
          >
            Buyer Requests
          </span>
          <span
            className={styles.link}
            onClick={() => {
              setShowAddProductForm(true);
              setError("");
              setProductName("");
              setCost("");
              setCategoryId("");
              setVisible(false);
              setImage(null);
            }}
          >
            Add Product
          </span>
          <span
            className={styles.link}
            onClick={() => {
              setShowCategoryForm(true);
              setError("");
              setNewCategoryName("");
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

                <label className={styles.fileInputLabel} htmlFor="productImageUpload">
  Upload Image {/* This is the text for your button */}
  <input
    type="file"
    id="productImageUpload" // Important for linking label to input
    accept="image/*"
    onChange={(e) => setImage(e.target.files[0])}
    // No inline style display: "none" here, let CSS handle it
  />
  {image ? (
    <span className={styles.fileName}>{image.name}</span>
  ) : (
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
                      setProductName("");
                      setCost("");
                      setCategoryId("");
                      setVisible(false);
                      setImage(null);
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
                      setNewCategoryName("");
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
                          {
                            allSellerProductsData.find(
                              (p) => p.id === req.product_id
                            )?.request_count || 0
                          }{" "}
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
        ) : (
          // Displaying seller's products
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
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}