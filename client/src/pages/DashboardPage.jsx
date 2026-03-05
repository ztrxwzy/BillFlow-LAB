import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function DashboardPage() {
  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/my/profile"),
      apiFetch("/api/my/orders?limit=5"),
      apiFetch("/api/my/invoices?limit=3")
    ])
      .then(([meData, ordersData, invoicesData]) => {
        setMe(meData);
        setOrders(ordersData);
        setInvoices(invoicesData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const pendingOrders = useMemo(() => orders.filter((item) => item.status === "PENDING").length, [orders]);

  return (
    <div className="content-grid">
      <section className="hero-panel">
        <h2>Welcome, {me?.full_name || "..."}</h2>
        <p>Resumen operativo de actividad, facturacion y pedidos recientes.</p>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="stat-row">
        <article className="stat-card">
          <h3>Total orders</h3>
          <p>{orders.length}</p>
        </article>
        <article className="stat-card">
          <h3>Pending orders</h3>
          <p>{pendingOrders}</p>
        </article>
        <article className="stat-card">
          <h3>Latest invoice</h3>
          <p>{invoices[0]?.invoice_number || "N/A"}</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Last 5 orders</h3>
          <Link to="/orders">View all</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item</th>
              <th>Status</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.item_name}</td>
                <td>{order.status}</td>
                <td>${order.price.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Last 3 invoices</h3>
          <Link to="/billing/invoices">View all</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Number</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.invoice_number}</td>
                <td>${invoice.total_amount.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
