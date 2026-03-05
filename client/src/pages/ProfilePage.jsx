import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const emptyForm = {
  full_name: "",
  email: "",
  company_name: "",
  cuil_cuit: "",
  tax_condition: "",
  billing_email: "",
  phone: ""
};

export default function ProfilePage() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiFetch("/api/my/profile")
      .then((res) => {
        setForm({
          full_name: res.full_name || "",
          email: res.email || "",
          company_name: res.company_name || "",
          cuil_cuit: res.cuil_cuit || "",
          tax_condition: res.tax_condition || "",
          billing_email: res.billing_email || "",
          phone: res.phone || ""
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await apiFetch("/api/my/profile", { method: "PUT", body: JSON.stringify(form) });
      setStatus("Perfil actualizado");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Profile</h2>
      <p>Gestion de datos de cuenta y facturacion.</p>
      {error && <p className="error">{error}</p>}
      {status && <p className="success">{status}</p>}
      <form className="grid-form" onSubmit={saveProfile}>
        {Object.keys(emptyForm).map((key) => (
          <label key={key}>
            {key}
            <input
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={key}
            />
          </label>
        ))}
        <button type="submit">Edit profile</button>
      </form>
    </section>
  );
}
