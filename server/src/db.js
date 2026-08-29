import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url) });

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: false
});

export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally { conn.release(); }
}

// Idempotent migration for databases created before whatsapp_confirmation_sent_at existed.
// Fresh installs already get the column from database/schema.sql. INFORMATION_SCHEMA is checked
// first because this MySQL version does not support ADD COLUMN IF NOT EXISTS.
pool.query(
  "SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'whatsapp_confirmation_sent_at'"
)
  .then(([[{ count }]]) => {
    if (count) return;
    return pool.query('ALTER TABLE orders ADD COLUMN whatsapp_confirmation_sent_at DATETIME NULL');
  })
  .catch((error) => console.error('[DB_MIGRATION] Unable to ensure whatsapp_confirmation_sent_at column', error.message));
