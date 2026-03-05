import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, downloadInvoicePdf } from "../lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/my/invoices")
      .then(setInvoices)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Billing / Invoices</h2>
        <span className="hint">Issued invoices and fiscal records</span>
      </div>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Invoice number</th>
            <th>Issued at</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.id}</td>
              <td>{invoice.invoice_number}</td>
              <td>{new Date(invoice.issued_at).toLocaleDateString("es-AR")}</td>
              <td>${invoice.total_amount.toLocaleString("es-AR")}</td>
              <td className="actions">
                <Link to={`/billing/invoices/${invoice.id}`}>Open</Link>
                <button onClick={() => downloadInvoicePdf(invoice.id)}>Download PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
