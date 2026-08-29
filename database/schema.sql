
CREATE DATABASE IF NOT EXISTS curve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE curve;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS password_reset_tokens, notifications, coupon_usage, coupons, order_status_history, payments, shipments, order_items, orders, cart_items, wishlist_items, application_history, applications, product_variants, product_images, products, categories, reviews, carousel_slides, homepage_sections, promotional_banners, fashion_videos, media_library, store_settings, user_addresses, users;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  mobile VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  date_of_birth DATE NULL,
  gender VARCHAR(40) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(40) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(120) NOT NULL,
  mobile VARCHAR(30) NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  sku VARCHAR(80) NOT NULL UNIQUE,
  description TEXT NULL,
  short_description VARCHAR(500) NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2) NULL,
  material VARCHAR(160) NULL,
  care_instructions TEXT NULL,
  shipping_information TEXT NULL,
  return_information TEXT NULL,
  tags JSON NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  new_arrival TINYINT(1) NOT NULL DEFAULT 0,
  best_seller TINYINT(1) NOT NULL DEFAULT 0,
  offer TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  seo_title VARCHAR(255) NULL,
  seo_description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_category(category_id),
  INDEX idx_products_flags(new_arrival, best_seller, featured, offer)
);

CREATE TABLE product_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  size VARCHAR(60) NOT NULL,
  color VARCHAR(80) NOT NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  price_override DECIMAL(12,2) NULL,
  sale_price_override DECIMAL(12,2) NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variant_product(product_id)
);

CREATE TABLE wishlist_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist(user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart(user_id, product_id, variant_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE applications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  application_code VARCHAR(30) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mobile VARCHAR(30) NOT NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(40) NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  preferred_category VARCHAR(120) NULL,
  preferred_size VARCHAR(60) NULL,
  preferred_contact_method VARCHAR(60) NULL,
  social_media VARCHAR(255) NULL,
  additional_message TEXT NULL,
  upload_url VARCHAR(500) NULL,
  status ENUM('Submitted','Under Review','Approved','Rejected','More Information Required','Completed') NOT NULL DEFAULT 'Submitted',
  admin_comment TEXT NULL,
  last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_app_user(user_id),
  INDEX idx_app_status(status)
);

CREATE TABLE application_history (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(60) NULL,
  new_status VARCHAR(60) NOT NULL,
  comment TEXT NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_code VARCHAR(40) NOT NULL UNIQUE,
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  coupon_code VARCHAR(80) NULL,
  payment_method ENUM('Razorpay','COD') NOT NULL DEFAULT 'Razorpay',
  payment_status ENUM('Pending','Authorized','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  order_status ENUM('Pending','Payment Pending','Paid','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned','Refunded') NOT NULL DEFAULT 'Pending',
  shipping_name VARCHAR(120) NOT NULL,
  shipping_email VARCHAR(190) NOT NULL,
  shipping_mobile VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL DEFAULT 'India',
  user_hidden_at DATETIME NULL,
  whatsapp_confirmation_sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_order_user(user_id),
  INDEX idx_order_status(order_status)
);

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  sku VARCHAR(80) NULL,
  size VARCHAR(60) NULL,
  color VARCHAR(80) NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE order_status_history (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(60) NULL,
  new_status VARCHAR(60) NOT NULL,
  note TEXT NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(60) NOT NULL,
  provider_order_id VARCHAR(180) NULL,
  provider_payment_id VARCHAR(180) NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(60) NOT NULL DEFAULT 'created',
  raw_reference TEXT NULL,
  authorized_at DATETIME NULL,
  captured_at DATETIME NULL,
  failed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uq_payment_provider_order(provider, provider_order_id),
  UNIQUE KEY uq_payment_provider_payment(provider, provider_payment_id)
);

CREATE TABLE invoices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  invoice_status ENUM('issued','void') NOT NULL DEFAULT 'issued',
  invoice_reference VARCHAR(255) NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE shipments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  courier_name VARCHAR(120) NULL,
  tracking_number VARCHAR(120) NULL,
  tracking_url VARCHAR(500) NULL,
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE coupons (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL UNIQUE,
  type ENUM('PERCENTAGE','FIXED') NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  min_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(12,2) NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_usage (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  coupon_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupon_order(coupon_id, order_id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE carousel_slides (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  subtitle VARCHAR(500) NULL,
  button_text VARCHAR(80) NULL,
  button_url VARCHAR(255) NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE homepage_sections (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  section_key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(180) NULL,
  subtitle VARCHAR(500) NULL,
  body TEXT NULL,
  image_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE promotional_banners (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  subtitle VARCHAR(500) NULL,
  button_text VARCHAR(80) NULL,
  button_url VARCHAR(255) NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE fashion_videos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  video_url VARCHAR(500) NULL,
  destination_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL,
  review_text TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE media_library (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  file_url VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  alt_text VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_settings (
  `key` VARCHAR(80) PRIMARY KEY,
  `value` TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO store_settings (`key`,`value`) VALUES
('store_name','CURVE'),
('currency','INR'),
('currency_symbol','₹'),
('contact_email','hello@curve.example'),
('phone','+91 90000 00000'),
('whatsapp','+91 90000 00000'),
('address','Chennai, Tamil Nadu, India'),
('newsletter_enabled','1'),
('store_status','testing'),
('shipping_flat_rate','99'),
('free_shipping_threshold','1999'),
('delivery_estimate','3-7 business days'),
('cod_enabled','1'),
('online_payment_enabled','1');

INSERT INTO categories (name,slug,description,image_url,display_order) VALUES
('Sarees','sarees','Timeless sarees for modern occasions','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',1),
('Kurtis','kurtis','Elegant everyday and occasion kurtis','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',2),
('Dresses','dresses','Contemporary feminine silhouettes','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',3),
('Tops','tops','Elevated essentials for every wardrobe','https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=80',4),
('Jewellery','jewellery','Subtle statement jewellery','https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',5),
('Handbags','handbags','Polished companions for every day','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',6),
('Accessories','accessories','Finishing touches with CURVE character','https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&q=80',7);

INSERT INTO products (category_id,name,slug,sku,description,short_description,price,sale_price,material,care_instructions,featured,new_arrival,best_seller,offer)
VALUES (1,'Rose Drape Silk Saree','rose-drape-silk-saree','CURVE-SAR-001','A softly luminous saree with graceful drape and refined border detailing.','An elegant silk-inspired drape for festive evenings.',4999,4299,'Silk blend','Dry clean recommended.',1,1,1,1);
SET @p1 = LAST_INSERT_ID();
INSERT INTO product_images(product_id,image_url,alt_text,display_order) VALUES
(@p1,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85','Rose Drape Silk Saree',1);
INSERT INTO product_variants(product_id,size,color,sku,stock_quantity) VALUES
(@p1,'Free Size','Rose','CURVE-SAR-001-RS',8);

INSERT INTO products (category_id,name,slug,sku,description,short_description,price,sale_price,material,care_instructions,featured,new_arrival,best_seller,offer)
VALUES (2,'Blush Embroidered Kurti','blush-embroidered-kurti','CURVE-KUR-001','A polished kurti with delicate embroidery and easy movement.','A feminine kurti designed for all-day elegance.',2499,1999,'Cotton blend','Gentle wash, line dry.',1,1,1,1);
SET @p2 = LAST_INSERT_ID();
INSERT INTO product_images(product_id,image_url,alt_text,display_order) VALUES
(@p2,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85','Blush Embroidered Kurti',1);
INSERT INTO product_variants(product_id,size,color,sku,stock_quantity) VALUES
(@p2,'S','Blush','CURVE-KUR-001-SB',4),(@p2,'M','Blush','CURVE-KUR-001-MB',8),(@p2,'L','Blush','CURVE-KUR-001-LB',6),(@p2,'XL','Blush','CURVE-KUR-001-XB',2);

INSERT INTO products (category_id,name,slug,sku,description,short_description,price,sale_price,material,care_instructions,featured,new_arrival,best_seller,offer)
VALUES (3,'Satin Evening Dress','satin-evening-dress','CURVE-DRS-001','A sleek satin-look evening dress with a fluid silhouette.','Modern evening dressing with a graceful finish.',3999,NULL,'Satin blend','Dry clean recommended.',1,1,0,0);
SET @p3 = LAST_INSERT_ID();
INSERT INTO product_images(product_id,image_url,alt_text,display_order) VALUES
(@p3,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85','Satin Evening Dress',1);
INSERT INTO product_variants(product_id,size,color,sku,stock_quantity) VALUES
(@p3,'S','Black','CURVE-DRS-001-SB',3),(@p3,'M','Black','CURVE-DRS-001-MB',5),(@p3,'L','Black','CURVE-DRS-001-LB',4);

INSERT INTO carousel_slides(title,subtitle,button_text,button_url,image_url,display_order) VALUES
('Elegance, Curated for You.','Discover timeless Indian fashion, thoughtfully selected for the modern woman.','SHOP COLLECTION','/shop','https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=85',1),
('Soft. Modern. Distinctly CURVE.','A considered edit of feminine silhouettes and understated details.','NEW ARRIVALS','/shop?newArrival=1','https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=85',2);

INSERT INTO homepage_sections(section_key,title,subtitle,display_order,is_active) VALUES
('shop_by_category','Shop by Category','Find your next favourite silhouette.',1,1),
('new_arrivals','New Arrivals','Fresh pieces, thoughtfully selected.',2,1),
('best_sellers','Best Sellers','The pieces our customers love most.',3,1),
('why_curve','Why Choose CURVE','Curated quality, polished service and effortless style.',4,1),
('newsletter','Stay in the CURVE','Receive first access to new arrivals and private offers.',5,1);

INSERT INTO promotional_banners(title,subtitle,button_text,button_url,image_url,display_order) VALUES
('The New Season Edit','Discover polished pieces for every plan.','SHOP NOW','/shop','https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1600&q=85',1);

INSERT INTO fashion_videos(title,description,thumbnail_url,video_url,destination_url,display_order) VALUES
('The CURVE Edit','Editorial movement and new-season styling.','https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80','', '/shop',1),
('Style Notes','Easy looks, elevated details.','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80','', '/shop',2),
('After Hours','Quiet luxury for evenings.','https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80','', '/shop',3);

INSERT INTO reviews(customer_name,rating,review_text,status,display_order) VALUES
('Aarohi',5,'Beautiful fabric and an incredibly thoughtful presentation.','Approved',1),
('Meera',5,'The fit guide made ordering easy, and the finish felt premium.','Approved',2),
('Nisha',4,'Lovely collection with a very polished shopping experience.','Approved',3);
