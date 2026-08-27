import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, User, Heart, X } from "lucide-react";
import { useApp } from "../context";
export default function Layout({ children }) {
  const { user, logout, cartCount } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <button
            className="icon-btn mobile-only"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="logo">
            CURVE<span>.</span>
          </Link>
          <nav className={`nav ${open ? "open" : ""}`}>
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/shop?newArrival=1">New Arrivals</Link>
            <Link to="/shop?offer=1">Offers</Link>
            <Link to="/account?tab=orders">Orders</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About Us</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => nav("/shop")}>
              <Search />
            </button>
            {user && (
              <button className="icon-btn" onClick={() => nav("/account")}>
                <User />
              </button>
            )}
            {user && (
              <button
                className="icon-btn"
                onClick={() => nav("/account?tab=wishlist")}
              >
                <Heart />
              </button>
            )}
            <button className="bag-btn" onClick={() => nav("/cart")}>
              <ShoppingBag />
              <span>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="logo footer-logo">
              CURVE<span>.</span>
            </div>
            <p>
              Premium women's fashion, thoughtfully curated for the modern
              woman.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/shop">Shop</Link>
            <Link to="/shop?newArrival=1">New Arrivals</Link>
            <Link to="/shop?offer=1">Offers</Link>
            <Link to="/about">About</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link to="/contact">Contact</Link>
            <Link to="/shipping-policy">Shipping</Link>
            <Link to="/returns-refunds">Returns</Link>
            <Link to="/privacy-policy">Privacy</Link>
          </div>
          <div>
            <h4>Account</h4>
            {user ? (
              <>
                <Link to="/account">My Account</Link>
                <button className="text-link" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} CURVE. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
