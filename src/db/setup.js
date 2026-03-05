const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { hashPassword } = require("../utils/security");
const { setDb } = require("./connection");

function nowIso() {
  return new Date().toISOString();
}

function ensureDemoPdfs() {
  const invoicesDir = path.join(__dirname, "..", "..", "storage", "invoices");
  fs.mkdirSync(invoicesDir, { recursive: true });

  const sampleAPath = path.join(invoicesDir, "invoice-A-000101.pdf");
  const sampleBPath = path.join(invoicesDir, "invoice-B-000231.pdf");

  if (!fs.existsSync(sampleAPath)) {
    fs.writeFileSync(
      sampleAPath,
      `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 65 >>
stream
BT
/F1 18 Tf
72 720 Td
(BillFlow Invoice INV-2026-000101) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
trailer
<< /Size 5 /Root 1 0 R >>
startxref
0
%%EOF`
    );
  }

  if (!fs.existsSync(sampleBPath)) {
    fs.writeFileSync(
      sampleBPath,
      `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 82 >>
stream
BT
/F1 18 Tf
72 720 Td
(BillFlow Fiscal Invoice INV-2026-000231 - 12450000 ARS) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
trailer
<< /Size 5 /Root 1 0 R >>
startxref
0
%%EOF`
    );
  }
}

async function createSchema(db) {
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      phone TEXT,
      company_name TEXT,
      cuil_cuit TEXT,
      tax_condition TEXT,
      billing_email TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      zip TEXT NOT NULL,
      country TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      shipping_address_id INTEGER,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(shipping_address_id) REFERENCES addresses(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      total_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      issued_at TEXT NOT NULL,
      pdf_path TEXT NOT NULL,
      billing_data_snapshot TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

async function seedDatabase(db) {
  const existing = await db.get("SELECT COUNT(*) AS count FROM users");
  if (existing.count > 0) return;

  const createdAt = nowIso();
  const users = [
    {
      username: "demo_a",
      password: "demo123",
      full_name: "Demo Analyst",
      email: "demo.a@billflow.local",
      role: "user"
    },
    {
      username: "victim_b",
      password: "victim123",
      full_name: "Finanzas Industriales SA",
      email: "billing@victim-b.local",
      role: "user"
    },
    {
      username: "admin",
      password: "admin123",
      full_name: "Admin BillFlow",
      email: "admin@billflow.local",
      role: "admin"
    }
  ];

  for (const user of users) {
    await db.run(
      `INSERT INTO users (username, password_hash, full_name, email, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.username, hashPassword(user.password), user.full_name, user.email, user.role, createdAt]
    );
  }

  const demoA = await db.get("SELECT id FROM users WHERE username = 'demo_a'");
  const victimB = await db.get("SELECT id FROM users WHERE username = 'victim_b'");

  await db.run(
    `INSERT INTO profiles (user_id, phone, company_name, cuil_cuit, tax_condition, billing_email)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [demoA.id, "+54 11 5555 0001", "Demo Freelance", "20-30111222-3", "Monotributo", "facturas+demo@billflow.local"]
  );

  await db.run(
    `INSERT INTO profiles (user_id, phone, company_name, cuil_cuit, tax_condition, billing_email)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [victimB.id, "+54 11 4000 9876", "Industrias Acme SA", "30-70999888-1", "Responsable Inscripto", "tesoreria@acme-industria.com.ar"]
  );

  await db.run(
    `INSERT INTO addresses (user_id, label, street, city, zip, country, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [demoA.id, "Casa", "Av. Demo 123", "Buenos Aires", "C1001", "AR", "Timbre 3B"]
  );
  await db.run(
    `INSERT INTO addresses (user_id, label, street, city, zip, country, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [victimB.id, "Oficina", "Parque Industrial 900", "Cordoba", "X5000", "AR", "Dejar en recepcion seguridad"]
  );

  const addressDemo = await db.get("SELECT id FROM addresses WHERE user_id = ?", [demoA.id]);
  const addressVictim = await db.get("SELECT id FROM addresses WHERE user_id = ?", [victimB.id]);

  await db.run(
    `INSERT INTO orders (user_id, item_name, quantity, price, shipping_address_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [demoA.id, "Plan Pro mensual", 1, 15000, addressDemo.id, "PAID", createdAt]
  );
  await db.run(
    `INSERT INTO orders (user_id, item_name, quantity, price, shipping_address_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [victimB.id, "Servidor dedicado enterprise", 3, 4150000, addressVictim.id, "PENDING", createdAt]
  );

  const billingSnapshotA = JSON.stringify({
    legal_name: "Demo Analyst",
    cuil_cuit: "20-30111222-3",
    fiscal_address: "Av. Demo 123, Buenos Aires",
    tax_condition: "Monotributo"
  });
  const billingSnapshotB = JSON.stringify({
    legal_name: "Industrias Acme SA",
    cuil_cuit: "30-70999888-1",
    fiscal_address: "Parque Industrial 900, Cordoba",
    tax_condition: "Responsable Inscripto"
  });

  await db.run(
    `INSERT INTO invoices
      (user_id, invoice_number, total_amount, tax_amount, issued_at, pdf_path, billing_data_snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [demoA.id, "INV-2026-000101", 15000, 3150, createdAt, "/storage/invoices/invoice-A-000101.pdf", billingSnapshotA]
  );

  await db.run(
    `INSERT INTO invoices
      (user_id, invoice_number, total_amount, tax_amount, issued_at, pdf_path, billing_data_snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      victimB.id,
      "INV-2026-000231",
      12450000,
      2614500,
      createdAt,
      "/storage/invoices/invoice-B-000231.pdf",
      billingSnapshotB
    ]
  );
}

async function initDatabase() {
  const dataDir = path.join(__dirname, "..", "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  ensureDemoPdfs();

  const db = await open({
    filename: path.join(dataDir, "billflow.sqlite"),
    driver: sqlite3.Database
  });

  await createSchema(db);
  await seedDatabase(db);
  setDb(db);
}

module.exports = {
  initDatabase
};
