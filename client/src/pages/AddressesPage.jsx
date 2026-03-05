import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const emptyAddress = {
  label: "",
  street: "",
  city: "",
  zip: "",
  country: "AR",
  notes: ""
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [editingAddress, setEditingAddress] = useState(emptyAddress);
  const [error, setError] = useState("");

  function loadMine() {
    apiFetch("/api/my/addresses")
      .then(setAddresses)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadMine();
  }, []);

  async function createAddress(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/api/my/addresses", {
        method: "POST",
        body: JSON.stringify(newAddress)
      });
      setNewAddress(emptyAddress);
      loadMine();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openEditor(id) {
    setError("");
    try {
      const data = await apiFetch(`/api/addresses/${id}`);
      setEditingId(id);
      setEditingAddress({
        label: data.label,
        street: data.street,
        city: data.city,
        zip: data.zip,
        country: data.country,
        notes: data.notes || ""
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEditor(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/api/addresses/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(editingAddress)
      });
      setEditingId(null);
      loadMine();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="content-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>Addresses</h2>
          <span className="hint">Shipping and billing addresses</span>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="cards">
          {addresses.map((addr) => (
            <article className="mini-card" key={addr.id}>
              <h4>{addr.label}</h4>
              <p>{addr.street}</p>
              <p>
                {addr.city} - {addr.zip}
              </p>
              <button onClick={() => openEditor(addr.id)}>Edit</button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel form-panel">
        <h3>Add new address</h3>
        <form className="grid-form" onSubmit={createAddress}>
          {Object.keys(emptyAddress).map((key) => (
            <label key={key}>
              {key}
              <input
                value={newAddress[key]}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </label>
          ))}
          <button type="submit">Add address</button>
        </form>
      </section>

      {editingId && (
        <section className="panel form-panel danger-outline">
          <h3>Edit address #{editingId}</h3>
          <form className="grid-form" onSubmit={saveEditor}>
            {Object.keys(emptyAddress).map((key) => (
              <label key={key}>
                {key}
                <input
                  value={editingAddress[key]}
                  onChange={(e) => setEditingAddress((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </label>
            ))}
            <button type="submit">Save changes</button>
          </form>
        </section>
      )}
    </div>
  );
}
