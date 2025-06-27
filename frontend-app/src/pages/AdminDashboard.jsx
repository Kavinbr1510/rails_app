import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaRedoAlt, FaChartPie } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [minCostOverall, setMinCostOverall] = useState(0);
  const [maxCostOverall, setMaxCostOverall] = useState(0);
  const [currentMinCost, setCurrentMinCost] = useState(0);
  const [currentMaxCost, setCurrentMaxCost] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterWarning, setFilterWarning] = useState("");
  const [showChartModal, setShowChartModal] = useState(false);

  // Refs
  const chartModalRef = useRef();

  const currentFiltersRef = useRef({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- Initial Data Fetching ---
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchCategories();
    fetchAllProductsForFiltering();
  }, [token, navigate]);

  // Click Outside Handler for Chart Modal
  useEffect(() => {
    function handleClickOutside(event) {
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
  }, [showChartModal]);

  // --- API Calls ---
  const fetchAllProductsForFiltering = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedProducts = res.data;
      setProducts(fetchedProducts);

      if (fetchedProducts.length > 0) {
        const costs = fetchedProducts.map((p) => p.cost);
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
      applyFiltersToDisplayProducts(currentFiltersRef.current, fetchedProducts);
    } catch (err) {
      console.error("Error loading products for Admin", err);
      setError("Failed to load product data.");
      setProducts([]);
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

  const handleStatus = async (id, status) => {
    try {
      const res = await axios.patch(
        `http://localhost:3000/products/${id}/approve_by_admin`,
        { product: { admin_status: status } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;

      const updatedProductsArray = products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      );
      setProducts(updatedProductsArray);
      applyFiltersToDisplayProducts(
        currentFiltersRef.current,
        updatedProductsArray
      );
    } catch (err) {
      console.error(`Error updating product status for ID ${id}:`, err);
      setError("Failed to update product status. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // --- Filtering Logic ---
  const applyFiltersToDisplayProducts = useCallback(
    (filters, productsToFilter = products) => {
      let filtered = [...productsToFilter];

      if (filters.status) {
        filtered = filtered.filter((p) => p.admin_status === filters.status);
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

      if (filters.start_date) {
        const start = new Date(filters.start_date).setHours(0, 0, 0, 0);
        filtered = filtered.filter((p) => {
          const productDate = new Date(p.created_at).setHours(0, 0, 0, 0);
          return productDate >= start;
        });
      }

      if (filters.end_date) {
        const end = new Date(filters.end_date).setHours(23, 59, 59, 999);
        filtered = filtered.filter((p) => {
          const productDate = new Date(p.created_at).setHours(0, 0, 0, 0);
          return productDate <= end;
        });
      }

      setProducts(filtered);
    },
    []
  );

  const handleApplyFilter = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3000/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allProducts = res.data;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start.getTime() > end.getTime()) {
          setFilterWarning(
            "Start date cannot be after end date. Please adjust."
          );
          setTimeout(() => setFilterWarning(""), 5000);
          setLoading(false);
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
      applyFiltersToDisplayProducts(filters, allProducts);
    } catch (err) {
      console.error("Error fetching products for filter application", err);
      setError("Failed to apply filters. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
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
    fetchAllProductsForFiltering();
  };

  const handleCheckboxChange = (status) => {
    setSelectedStatusFilter((prev) => (prev === status ? "" : status));
  };

  const handleMinCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = minCostOverall;
    }
    if (value > currentMaxCost) {
      value = currentMaxCost;
    }
    setCurrentMinCost(value);
  };

  const handleMaxCostChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = maxCostOverall;
    }
    if (value < currentMinCost) {
      value = currentMinCost;
    }
    setCurrentMaxCost(value);
  };

  // --- Chart Data Calculation ---
  const getChartData = () => {
    const pending = products.filter((p) => p.admin_status === "pending").length;
    const approved = products.filter(
      (p) => p.admin_status === "approved"
    ).length;
    const rejected = products.filter(
      (p) => p.admin_status === "rejected"
    ).length;

    return [
      { name: "Pending", value: pending },
      { name: "Approved", value: approved },
      { name: "Rejected", value: rejected },
    ].filter((item) => item.value > 0);
  };

  const chartData = getChartData();
  const COLORS = ["#FFBB28", "#00C49F", "#FF8042"];

  const effectiveMinCost = Math.max(minCostOverall, currentMinCost);
  const effectiveMaxCost = Math.min(maxCostOverall, currentMaxCost);

  const totalRange = maxCostOverall - minCostOverall;
  const minPercent =
    totalRange > 0
      ? ((effectiveMinCost - minCostOverall) / totalRange) * 100
      : 0;
  const maxPercent =
    totalRange > 0
      ? ((effectiveMaxCost - minCostOverall) / totalRange) * 100
      : 0;

  const renderCard = (p) => {
    const categoryName =
      categories.find((cat) => cat.id === p.category_id)?.name || "N/A";
    return (
      <div key={p.id} className={styles.card}>
        <img
          src={
            p.image_url || "https://via.placeholder.com/400x200?text=No+Image"
          }
          alt={p.product_name}
          className={styles.productImage}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
          }}
        />
        <div className={styles.cardBody}>
          <div>
            <h5 className={styles.cardTitle}>{p.product_name}</h5>
            <p className={styles.cardInfoCombined}>
              <span>
                👤 <strong>{p.seller?.name || "Unknown"}</strong>
              </span>
              <span className={styles.categoryInfo}>🏷️ {categoryName}</span>
            </p>
          </div>
          <span
            className={`${styles.statusBadge} ${
              p.admin_status === "approved"
                ? styles.statusApproved
                : p.admin_status === "pending"
                ? styles.statusPending
                : styles.statusRejected
            }`}
          >
            {p.admin_status.charAt(0).toUpperCase() + p.admin_status.slice(1)}
          </span>
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.productCost}>₹{p.cost}</span>
          <div className={styles.actionButtons}>
            {p.admin_status === "pending" && (
              <>
                <button
                  onClick={() => handleStatus(p.id, "approved")}
                  className={styles.approveButton}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatus(p.id, "rejected")}
                  className={styles.rejectButton}
                >
                  Reject
                </button>
              </>
            )}
            {p.admin_status === "rejected" && (
              <button
                onClick={() => handleStatus(p.id, "approved")}
                className={styles.approveButton}
              >
                Re-Approve
              </button>
            )}
            {p.admin_status === "approved" && (
              <button
                onClick={() => handleStatus(p.id, "rejected")}
                className={styles.rejectButton}
              >
                Re-Reject
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Filter Sidebar */}
      <div className={styles.sideFilter}>
        <div className={styles.sideFilterHeader}>
          <h2>Filters</h2>
          <button className={styles.resetButton} onClick={handleResetFilter}>
            <FaRedoAlt /> Reset
          </button>
        </div>

        {/* Status Filter */}
        <div className={styles.filterSection}>
          <h3>Product Status</h3>
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

        {/* Price Range Filter */}
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
              style={{ zIndex: currentMinCost > currentMaxCost ? 3 : 2 }}
            />
            <input
              type="range"
              min={minCostOverall}
              max={maxCostOverall}
              value={currentMaxCost}
              onChange={handleMaxCostChange}
              className={styles.rangeSliderMax}
              style={{ zIndex: currentMaxCost < currentMinCost ? 3 : 2 }}
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

        {/* Category Filter */}
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

        {/* Product Creation Date Range Filter */}
        <div className={styles.filterSection}>
          <h3>Creation Date Range</h3>
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
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          {/* Chart Icon */}
          <div className={styles.chartIcon}>
            <FaChartPie onClick={() => setShowChartModal(!showChartModal)} />
          </div>
          <button onClick={handleLogout} className={styles.logout}>
            Logout
          </button>
        </div>

        {/* Chart Modal */}
        {showChartModal && (
          <div className={styles.modalOverlay}>
            <div ref={chartModalRef} className={styles.chartModalCard}>
              <h2>Product Status Overview</h2>
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

        {/* Product Display Area - Wrapped in scrollableContent */}
        <div className={styles.scrollableContent}>
          {error && <div className={styles.warning}>⚠️ {error}</div>}
          {loading ? (
            <p className={styles.loadingMessage}>Loading products...</p>
          ) : products.length === 0 ? (
            <div className={styles.emptyMessage}>
              <h2>No Products Found</h2>
              <p>There are no products matching your selected filters.</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>{products.map(renderCard)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
