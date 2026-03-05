import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearToken, isAuthenticated } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AddressesPage from "./pages/AddressesPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/profile", label: "Profile" },
    { path: "/addresses", label: "Addresses" },
    { path: "/orders", label: "Orders" },
    { path: "/billing/invoices", label: "Billing" }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>BillFlow</h1>
        <p>Web Dashboard</p>
        <nav>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={location.pathname.startsWith(link.path) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          className="danger-btn"
          onClick={() => {
            clearToken();
            navigate("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <div className="status-chip danger">BillFlow Dashboard</div>
          <span className="note">Internal Operations</span>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <Shell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/addresses" element={<AddressesPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/billing/invoices" element={<InvoicesPage />} />
                <Route path="/billing/invoices/:invoiceId" element={<InvoiceDetailPage />} />
              </Routes>
            </Shell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
