import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/my/orders")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Orders</h2>
        <span className="hint">Purchase history and shipment state</span>
      </div>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Item</th>
            <th>Price</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.item_name}</td>
              <td>${order.price.toLocaleString("es-AR")}</td>
              <td>{order.status}</td>
              <td>
                <Link to={`/orders/${order.id}`}>View details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
