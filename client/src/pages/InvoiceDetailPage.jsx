import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, downloadInvoicePdf } from "../lib/api";

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [manualId, setManualId] = useState(invoiceId);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    apiFetch(`/api/invoices/${invoiceId}`)
      .then(setInvoice)
      .catch((err) => setError(err.message));
  }, [invoiceId]);

  const billingSnapshot = useMemo(() => {
    if (!invoice?.billing_data_snapshot) return {};
    try {
      return JSON.parse(invoice.billing_data_snapshot);
    } catch {
      return {};
    }
  }, [invoice]);

  return (
    <section className="panel form-panel danger-outline">
      <h2>Invoice detail #{invoiceId}</h2>
      <div className="jump-row">
        <input value={manualId} onChange={(e) => setManualId(e.target.value)} />
        <button onClick={() => navigate(`/billing/invoices/${manualId}`)}>Load ID</button>
      </div>
      {error && <p className="error">{error}</p>}
      {invoice && (
        <div className="details-grid">
          <p>
            <strong>Invoice number:</strong> {invoice.invoice_number}
          </p>
          <p>
            <strong>Issued at:</strong> {new Date(invoice.issued_at).toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Total:</strong> ${invoice.total_amount.toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Tax:</strong> ${invoice.tax_amount.toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Razon social:</strong> {billingSnapshot.legal_name}
          </p>
          <p>
            <strong>CUIT/CUIL:</strong> {billingSnapshot.cuil_cuit}
          </p>
          <p>
            <strong>Domicilio fiscal:</strong> {billingSnapshot.fiscal_address}
          </p>
          <p>
            <strong>Tax condition:</strong> {billingSnapshot.tax_condition}
          </p>
        </div>
      )}
      <button onClick={() => downloadInvoicePdf(invoiceId)}>Download PDF</button>
    </section>
  );
}
