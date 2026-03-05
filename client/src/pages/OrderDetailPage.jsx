import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ status: "", shipping_address_id: "" });
  const [manualId, setManualId] = useState(orderId);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setError("");
    setStatus("");
    apiFetch(`/api/orders/${orderId}`)
      .then((data) => {
        setOrder(data);
        setForm({
          status: data.status,
          shipping_address_id: String(data.shipping_address_id || "")
        });
      })
      .catch((err) => setError(err.message));
  }, [orderId]);

  async function updateOrder(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await apiFetch(`/api/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: form.status,
          shipping_address_id: Number(form.shipping_address_id)
        })
      });
      setStatus("Order updated");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel form-panel danger-outline">
      <h2>Order detail #{orderId}</h2>
      <div className="jump-row">
        <input value={manualId} onChange={(e) => setManualId(e.target.value)} />
        <button onClick={() => navigate(`/orders/${manualId}`)}>Load ID</button>
      </div>
      {error && <p className="error">{error}</p>}
      {order && (
        <div className="details-grid">
          <p>
            <strong>Item:</strong> {order.item_name}
          </p>
          <p>
            <strong>Quantity:</strong> {order.quantity}
          </p>
          <p>
            <strong>Price:</strong> ${order.price.toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Created:</strong> {new Date(order.created_at).toLocaleString("es-AR")}
          </p>
        </div>
      )}
      {status && <p className="success">{status}</p>}
      <form className="grid-form" onSubmit={updateOrder}>
        <label>
          status
          <input value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} />
        </label>
        <label>
          shipping_address_id
          <input
            value={form.shipping_address_id}
            onChange={(e) => setForm((prev) => ({ ...prev, shipping_address_id: e.target.value }))}
          />
        </label>
        <button type="submit">Update shipping address / status</button>
      </form>
    </section>
  );
}
