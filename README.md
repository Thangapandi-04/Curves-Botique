# CURVE — React + Node/Express + MySQL

Production-oriented ecommerce foundation for the CURVE premium women's fashion boutique.

## Stack
- React 19 + Vite 8
- Node.js + Express 5
- MySQL 8 / MariaDB-compatible SQL
- JWT stored in an HTTP-only cookie
- bcrypt password hashing
- Multer for controlled image uploads
- Helmet + CORS + rate limiting + Zod validation

## Project layout
```
curve-sql-commerce/
  client/     React storefront + USER PANEL + ADMIN PANEL
  server/     Express API + auth + business rules + uploads
  database/   MySQL schema + seed data
  uploads/    local development uploads
```

## 1) Database
Create a MySQL database and run `database/schema.sql`.

```sql
CREATE DATABASE curve;
USE curve;
SOURCE database/schema.sql;
```

Then create `.env` from `server/.env.example`.

## 2) Server
```bash
cd server
npm install
npm run dev
```

API runs at `http://localhost:5000`.

## 3) Client
```bash
cd client
npm install
npm run dev
```

Frontend runs at the Vite URL, normally `http://localhost:5173`.

## Demo credentials
The seed script creates:
- Admin: `admin@curve.local` / `ChangeMe_Admin_123!`
- User: `customer@curve.local` / `ChangeMe_User_123!`

**Change these immediately in a real deployment.** The seeded passwords are only for local setup.

## Production checklist
- Set a strong `JWT_SECRET`.
- Use HTTPS and secure cookies.
- Point `DB_*` variables at a managed MySQL/MariaDB database.
- Store uploads on persistent object storage/CDN if the deployment filesystem is ephemeral.
- Configure an actual payment provider webhook before marking payments paid.
- Configure an email provider for verification/reset/order emails.
- Configure shipping/courier integration before exposing live tracking.
- Replace seeded admin password and disable seed users if not needed.

Order confirmation emails require SMTP settings in `server/.env`. The customer receives an invoice-style confirmation and active administrators receive a new-order alert after COD confirmation or captured Razorpay payment. In-app notifications are saved even when SMTP is not configured.

Razorpay webhook setup: add `RAZORPAY_WEBHOOK_SECRET` to `server/.env`, then configure the public URL `https://your-domain.example/api/payment/webhook` in Razorpay Dashboard under Settings > Webhooks. Subscribe to `payment.captured` and `payment.failed`. Checkout confirmation is immediate after valid signature authorization; the webhook only records later settlement or failure.

## Current payment behavior
The application creates pending orders and exposes a provider-ready payment status flow. It deliberately does **not** fake a successful payment. A real payment provider can call the protected confirmation endpoint/webhook after credentials are configured.
