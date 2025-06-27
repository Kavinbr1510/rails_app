import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useEffect } from "react";

function NotFoundRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    alert("Page not found. Redirecting to login.");
    navigate('/');
  }, []);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/seller-dashboard"
            element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>}
          />
          <Route
            path="/buyer-dashboard"
            element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
