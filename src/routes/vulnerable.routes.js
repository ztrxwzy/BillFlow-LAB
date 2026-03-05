const express = require("express");
const path = require("path");
const fs = require("fs");
const { getDb } = require("../db/connection");
const { authRequired } = require("../middleware/auth");
const { parseLimit, parseNumericId } = require("../utils/request");
const { decodeBase64Id, encodeBase64Id } = require("../utils/obfuscation");

const router = express.Router();

router.get("/api/my/orders", authRequired, async (req, res) => {
  const db = getDb();
  const limit = parseLimit(req.query.limit, 100);
  const rows = await db.all(
    `SELECT id, user_id, item_name, quantity, price, shipping_address_id, status, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [req.user.id, limit]
  );
  return res.json(rows);
});

router.get("/api/my/invoices", authRequired, async (req, res) => {
  const db = getDb();
  const limit = parseLimit(req.query.limit, 100);
  const rows = await db.all(
    `SELECT id, user_id, invoice_number, total_amount, tax_amount, issued_at, pdf_path, billing_data_snapshot
     FROM invoices
     WHERE user_id = ?
     ORDER BY issued_at DESC
     LIMIT ?`,
    [req.user.id, limit]
  );

  const obfuscated = rows.map((row) => ({
    ...row,
    id: encodeBase64Id(row.id)
  }));
  return res.json(obfuscated);
});

router.get("/api/my/profile", authRequired, async (req, res) => {
  const db = getDb();
  const row = await db.get(
    `SELECT
      u.id AS user_id,
      u.username,
      u.full_name,
      u.email,
      p.id AS profile_id,
      p.phone,
      p.company_name,
      p.cuil_cuit,
      p.tax_condition,
      p.billing_email
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!row) return res.status(404).json({ error: "Profile not found" });
  return res.json(row);
});

router.put("/api/my/profile", authRequired, async (req, res) => {
  const db = getDb();
  const current = await db.get(
    `SELECT
      u.id AS user_id,
      u.full_name,
      u.email,
      p.id AS profile_id,
      p.phone,
      p.company_name,
      p.cuil_cuit,
      p.tax_condition,
      p.billing_email
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [req.user.id]
  );
  if (!current) return res.status(404).json({ error: "Profile not found" });

  const userPayload = {
    full_name: req.body.full_name ?? current.full_name,
    email: req.body.email ?? current.email
  };
  const profilePayload = {
    phone: req.body.phone ?? current.phone,
    company_name: req.body.company_name ?? current.company_name,
    cuil_cuit: req.body.cuil_cuit ?? current.cuil_cuit,
    tax_condition: req.body.tax_condition ?? current.tax_condition,
    billing_email: req.body.billing_email ?? current.billing_email
  };

  await db.run("UPDATE users SET full_name = ?, email = ? WHERE id = ?", [
    userPayload.full_name,
    userPayload.email,
    req.user.id
  ]);

  if (current.profile_id) {
    await db.run(
      `UPDATE profiles
       SET phone = ?, company_name = ?, cuil_cuit = ?, tax_condition = ?, billing_email = ?
       WHERE user_id = ?`,
      [
        profilePayload.phone,
        profilePayload.company_name,
        profilePayload.cuil_cuit,
        profilePayload.tax_condition,
        profilePayload.billing_email,
        req.user.id
      ]
    );
  } else {
    await db.run(
      `INSERT INTO profiles (user_id, phone, company_name, cuil_cuit, tax_condition, billing_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        profilePayload.phone || "",
        profilePayload.company_name || "",
        profilePayload.cuil_cuit || "",
        profilePayload.tax_condition || "",
        profilePayload.billing_email || ""
      ]
    );
  }

  const updated = await db.get(
    `SELECT
      u.id AS user_id,
      u.username,
      u.full_name,
      u.email,
      p.id AS profile_id,
      p.phone,
      p.company_name,
      p.cuil_cuit,
      p.tax_condition,
      p.billing_email
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [req.user.id]
  );
  return res.json(updated);
});

router.get("/api/my/addresses", authRequired, async (req, res) => {
  const db = getDb();
  const rows = await db.all(
    `SELECT id, user_id, label, street, city, zip, country, notes
     FROM addresses
     WHERE user_id = ?
     ORDER BY id DESC`,
    [req.user.id]
  );
  return res.json(rows);
});

router.post("/api/my/addresses", authRequired, async (req, res) => {
  const { label, street, city, zip, country, notes } = req.body;
  if (!label || !street || !city || !zip || !country) {
    return res.status(400).json({ error: "label, street, city, zip and country are required" });
  }

  const db = getDb();
  const insert = await db.run(
    `INSERT INTO addresses (user_id, label, street, city, zip, country, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, label, street, city, zip, country, notes || ""]
  );

  const created = await db.get("SELECT * FROM addresses WHERE id = ?", [insert.lastID]);
  return res.status(201).json(created);
});

router.put("/api/my/addresses/:id", authRequired, async (req, res) => {
  const addressId = parseNumericId(req.params.id);
  if (addressId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const current = await db.get("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [addressId, req.user.id]);
  if (!current) return res.status(404).json({ error: "Address not found" });

  const payload = {
    label: req.body.label ?? current.label,
    street: req.body.street ?? current.street,
    city: req.body.city ?? current.city,
    zip: req.body.zip ?? current.zip,
    country: req.body.country ?? current.country,
    notes: req.body.notes ?? current.notes
  };

  await db.run(
    `UPDATE addresses
     SET label = ?, street = ?, city = ?, zip = ?, country = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [payload.label, payload.street, payload.city, payload.zip, payload.country, payload.notes, addressId, req.user.id]
  );

  const updated = await db.get("SELECT * FROM addresses WHERE id = ? AND user_id = ?", [addressId, req.user.id]);
  return res.json(updated);
});

router.get("/api/profiles/:id", authRequired, async (req, res) => {
  const profileId = parseNumericId(req.params.id);
  if (profileId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const profile = await db.get("SELECT * FROM profiles WHERE id = ?", [profileId]);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  return res.json(profile);
});

router.get("/api/addresses/:id", authRequired, async (req, res) => {
  const addressId = parseNumericId(req.params.id);
  if (addressId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const address = await db.get("SELECT * FROM addresses WHERE id = ?", [addressId]);
  if (!address) return res.status(404).json({ error: "Address not found" });
  return res.json(address);
});

router.put("/api/addresses/:id", authRequired, async (req, res) => {
  const addressId = parseNumericId(req.params.id);
  if (addressId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const current = await db.get("SELECT * FROM addresses WHERE id = ?", [addressId]);
  if (!current) return res.status(404).json({ error: "Address not found" });

  const payload = {
    label: req.body.label ?? current.label,
    street: req.body.street ?? current.street,
    city: req.body.city ?? current.city,
    zip: req.body.zip ?? current.zip,
    country: req.body.country ?? current.country,
    notes: req.body.notes ?? current.notes
  };

  await db.run(
    `UPDATE addresses
     SET label = ?, street = ?, city = ?, zip = ?, country = ?, notes = ?
     WHERE id = ?`,
    [payload.label, payload.street, payload.city, payload.zip, payload.country, payload.notes, addressId]
  );

  const updated = await db.get("SELECT * FROM addresses WHERE id = ?", [addressId]);
  return res.json(updated);
});

router.get("/api/orders/:id", authRequired, async (req, res) => {
  const orderId = parseNumericId(req.params.id);
  if (orderId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});

router.put("/api/orders/:id", authRequired, async (req, res) => {
  const orderId = parseNumericId(req.params.id);
  if (orderId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const current = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!current) return res.status(404).json({ error: "Order not found" });

  const payload = {
    item_name: req.body.item_name ?? current.item_name,
    quantity: req.body.quantity ?? current.quantity,
    price: req.body.price ?? current.price,
    shipping_address_id: req.body.shipping_address_id ?? current.shipping_address_id,
    status: req.body.status ?? current.status
  };

  await db.run(
    `UPDATE orders
     SET item_name = ?, quantity = ?, price = ?, shipping_address_id = ?, status = ?
     WHERE id = ?`,
    [payload.item_name, payload.quantity, payload.price, payload.shipping_address_id, payload.status, orderId]
  );

  const updated = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  return res.json(updated);
});

router.get("/api/invoices/:id", authRequired, async (req, res) => {
  const invoiceId = decodeBase64Id(req.params.id);
  if (invoiceId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const invoice = await db.get("SELECT * FROM invoices WHERE id = ?", [invoiceId]);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  return res.json({
    ...invoice,
    id: encodeBase64Id(invoice.id)
  });
});

router.get("/api/invoices/:id/pdf", authRequired, async (req, res) => {
  const invoiceId = decodeBase64Id(req.params.id);
  if (invoiceId === null) return res.status(400).json({ error: "Invalid id" });

  const db = getDb();
  const invoice = await db.get("SELECT id, user_id, invoice_number, pdf_path FROM invoices WHERE id = ?", [invoiceId]);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const absolutePath = path.join(__dirname, "..", "..", invoice.pdf_path);
  if (!fs.existsSync(absolutePath)) {
    return res.status(500).json({ error: "PDF not found on disk" });
  }

  return res.download(absolutePath, `${invoice.invoice_number}.pdf`);
});

module.exports = router;
