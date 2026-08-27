# CURVE Architecture

## Runtime
React 19 + Vite 8 → Node.js + Express 5 → MySQL / MariaDB SQL.

## Authentication
JWT is signed server-side and stored in an HTTP-only cookie. React never receives the raw JWT. Passwords are hashed with bcrypt.

## Authorization
The backend enforces USER and ADMIN access. Frontend route guards are convenience checks only; backend authorization is authoritative.

## Data ownership
USER accounts can read/write only their own profile, applications, orders, wishlist, cart and notifications. ADMIN routes are separate and protected.

## Ecommerce
Products are database-driven. Variations hold size/color/SKU/stock. The order endpoint recalculates totals server-side and locks cart rows during order creation.

## Dynamic content
Hero slides, homepage sections, promotional banners, fashion videos, reviews, categories and store settings come from SQL.

## Payment
The schema includes payment records and provider fields. No fake success is generated. Configure a real provider and webhook before marking online payments as paid.

## Files
Uploads are validated and stored outside the React bundle. For production use persistent object storage/CDN where the hosting filesystem is not persistent.
