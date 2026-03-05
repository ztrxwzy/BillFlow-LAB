import { getToken } from "./auth";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" ? payload.error : payload || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export async function apiFetch(path, options = {}, withAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (withAuth && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const response = await fetch(path, { ...options, headers });
  return parseResponse(response);
}

export async function downloadInvoicePdf(invoiceId) {
  const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Download failed" }));
    throw new Error(payload.error || "Download failed");
  }

  const blob = await response.blob();
  const fileUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = `invoice-${invoiceId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(fileUrl);
}
