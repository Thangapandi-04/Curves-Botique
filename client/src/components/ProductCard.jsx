import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { api, img } from "../api";
import { useApp } from "../context";

const bubbleShapes = [
  ["46% 54% 43% 57% / 22% 34% 66% 78%", "35% 65% 58% 42% / 34% 18% 82% 66%"],
  ["58% 42% 62% 38% / 29% 18% 82% 71%", "39% 61% 47% 53% / 16% 52% 48% 84%"],
  ["63% 37% 47% 53% / 35% 23% 77% 65%", "44% 56% 67% 33% / 23% 61% 39% 77%"],
  ["38% 62% 56% 44% / 43% 26% 74% 57%", "57% 43% 36% 64% / 29% 69% 31% 71%"],
];

export default function ProductCard({ p, isNewArrival = false, bubbleIndex = 0 }) {
  const { user, refreshCart } = useApp();
  const navigate = useNavigate();
  const price = Number(p.sale_price ?? p.salePrice ?? p.price);
  const old = p.sale_price ? Number(p.price) : null;
  const [bubbleStart, bubbleHover] = bubbleShapes[isNewArrival ? 3 : bubbleIndex % 4];
  const bubbleStyle = isNewArrival
    ? { "--bubble-start": bubbleStart, "--bubble-hover": bubbleHover }
    : undefined;

  async function addToCart() {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent(location.pathname));
      return;
    }
    try {
      await api("/me/cart", {
        method: "POST",
        body: JSON.stringify({ productId: p.id, quantity: 1 }),
      });
      await refreshCart();
      navigate("/cart");
    } catch (error) {
      alert(error.message || "This product is currently out of stock.");
    }
  }

  async function wish() {
    if (!user) {
      navigate("/login");
      return;
    }
    await api(`/me/wishlist/${p.id}`, { method: "POST" });
  }

  return (
    <article className="product-card">
      <div className={`product-media${isNewArrival ? " new-arrival-media" : ""}`} style={bubbleStyle}>
        <Link to={`/product/${p.slug}`}>
          <img className="product-image-primary" src={img(p.image_url)} alt={p.name} />
          {isNewArrival && p.hover_image_url && (
            <img className="product-image-hover" src={img(p.hover_image_url)} alt="" aria-hidden="true" />
          )}
        </Link>
        <button className="wish-fab" onClick={wish} aria-label={`Add ${p.name} to wishlist`}>
          <Heart size={18} />
        </button>
      </div>
      <div className="product-info">
        <div className="eyebrow">{p.category_name || "CURVE"}</div>
        <Link className="product-name" to={`/product/${p.slug}`}>{p.name}</Link>
        <div className="price-row">
          <strong>₹{price.toLocaleString("en-IN")}</strong>
          {old && <del>₹{old.toLocaleString("en-IN")}</del>}
        </div>
        <button className="line-btn" onClick={addToCart}>Quick add</button>
      </div>
    </article>
  );
}
