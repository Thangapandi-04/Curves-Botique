import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Heart,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { api, img } from "../api";
import { useApp } from "../context";
import ProductCard from "../components/ProductCard";
const razorpayUpiConfig = {
  method: {
    upi: true,
    card: true,
    netbanking: true,
    emi: false,
    wallet: false,
    paylater: false,
  },
};
function logRazorpayCheckout(orderId, options) {
  console.info("[Razorpay] Standard Checkout", {
    testMode: options.key?.startsWith("rzp_test_") === true,
    keyPrefix: options.key?.slice(0, 9),
    orderId,
    razorpayOrderId: options.order_id,
    currency: options.currency,
    methods: options.method,
  });
}
function isPaymentPending(status) {
  return String(status || "").trim().toLowerCase() === "pending";
}
function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
export function Home() {
  const [d, setD] = useState(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    api("/home").then(setD).catch(console.error);
  }, []);
  useEffect(() => {
    if (!d?.slides?.length) return undefined;
    const timer = setInterval(() => setI((current) => (current + 1) % d.slides.length), 2000);
    return () => clearInterval(timer);
  }, [d?.slides?.length]);
  if (!d) return <div className="center-screen">Loading CURVE…</div>;
  const slide = d.slides[i % d.slides.length];
  return (
    <>
      <section className="hero">
        <img key={slide?.id} className="hero-image" src={img(slide?.image_url)} alt={slide?.title || "CURVE collection"} />
        <div className="hero-overlay">
          <div className="container hero-content">
            <span className="eyebrow light">THE CURVE EDIT</span>
            <h1>{slide?.title || "Elegance, Curated for You."}</h1>
            <p>
              {slide?.subtitle ||
                "Discover timeless Indian fashion, thoughtfully selected for the modern woman."}
            </p>
            <Link className="btn btn-light" to={slide?.button_url || "/shop"}>
              {slide?.button_text || "SHOP COLLECTION"} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-controls">
          <button
            onClick={() => setI((i - 1 + d.slides.length) % d.slides.length)}
          >
            <ChevronLeft />
          </button>
          <span>
            {i + 1} / {d.slides.length}
          </span>
          <button onClick={() => setI((i + 1) % d.slides.length)}>
            <ChevronRight />
          </button>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            title="Shop by Category"
            sub="Find your next favourite silhouette."
          />
          <div className="category-grid">
            {d.categories.map((c) => (
              <Link
                className="category-card"
                key={c.id}
                to={`/shop?category=${c.slug}`}
              >
                <img src={img(c.image_url)} alt={c.name} />
                <div>
                  <span>{c.name}</span>
                  <ArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ProductSection
        title="New Arrivals"
        sub="Fresh pieces, thoughtfully selected."
        products={d.newArrivals}
        isNewArrivals
      />
      <section className="section warm">
        <div className="container split-banner">
          <div>
            <span className="eyebrow">THE NEW SEASON EDIT</span>
            <h2>{d.banners[0]?.title || "Style, with intention."}</h2>
            <p>
              {d.banners[0]?.subtitle ||
                "Discover polished pieces for every plan."}
            </p>
            <Link
              className="btn btn-dark"
              to={d.banners[0]?.button_url || "/shop"}
            >
              {d.banners[0]?.button_text || "SHOP NOW"} <ArrowRight size={16} />
            </Link>
          </div>
          <img src={img(d.banners[0]?.image_url)} alt="CURVE edit" />
        </div>
      </section>
      <ProductSection
        title="Best Sellers"
        sub="The pieces our customers love most."
        products={d.bestSellers}
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            title="Why Choose CURVE"
            sub="Curated quality, polished service and effortless style."
          />
          <div className="feature-grid">
            <Feature
              icon={<Sparkles />}
              title="Curated"
              text="A considered selection built around modern femininity."
            />
            <Feature
              icon={<ShieldCheck />}
              title="Thoughtful"
              text="Clear product details, secure accounts and transparent service."
            />
            <Feature
              icon={<Truck />}
              title="Reliable"
              text="Careful fulfillment with trackable order updates."
            />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionIntro
            title="Fashion in Motion"
            sub="A visual look at the CURVE point of view."
          />
          <div className="video-grid">
            {d.videos.map((v) => (
              <Link
                key={v.id}
                className="video-card"
                to={v.destination_url || "/shop"}
              >
                <img src={img(v.thumbnail_url)} alt={v.title} />
                <span>{v.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section blush">
        <div className="container">
          <SectionIntro
            title="Customer Reviews"
            sub="Real thoughts from CURVE customers."
          />
          <div className="review-grid">
            {d.reviews.map((r) => (
              <div className="review-card" key={r.id}>
                <div className="stars">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                <p>“{r.review_text}”</p>
                <strong>{r.customer_name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div className="container">
          <div>
            <span className="eyebrow">STAY IN THE CURVE</span>
            <h2>First access to new arrivals and private offers.</h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Newsletter connection is ready for provider setup.");
            }}
          >
            <input placeholder="Your email address" type="email" required />
            <button className="btn btn-dark">JOIN</button>
          </form>
        </div>
      </section>
    </>
  );
}
function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function SectionIntro({ title, sub }) {
  return (
    <div className="section-intro">
      <div>
        <span className="eyebrow">CURVE</span>
        <h2>{title}</h2>
      </div>
      <p>{sub}</p>
    </div>
  );
}
function ProductSection({ title, sub, products, isNewArrivals = false }) {
  return (
    <section className="section">
      <div className="container">
        <SectionIntro title={title} sub={sub} />
        <div className="product-grid">
          {products.map((p, index) => (
            <ProductCard
              key={p.id}
              p={p}
              isNewArrival={isNewArrivals}
              bubbleIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Shop() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const [d, setD] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("newest");
  useEffect(() => {
    api("/categories").then((r) => setCats(r.categories));
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (params.get("category")) p.set("category", params.get("category"));
    if (params.get("newArrival")) p.set("newArrival", "1");
    if (params.get("offer")) p.set("offer", "1");
    p.set("sort", sort);
    api("/products?" + p.toString()).then((r) => setD(r.products));
  }, [loc.search, q, sort]);
  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">THE SHOP</span>
            <h1>Discover CURVE</h1>
          </div>
          <p>Modern silhouettes, Indian craft and polished everyday pieces.</p>
        </div>
        <div className="shop-toolbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
            />
          </form>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-low">Price Low–High</option>
            <option value="price-high">Price High–Low</option>
            <option value="popular">Popular</option>
          </select>
        </div>
        <div className="shop-layout">
          <aside className="filters">
            <h3>Categories</h3>
            {cats.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`}>
                {c.name}
              </Link>
            ))}
            <Link to="/shop?newArrival=1">New Arrivals</Link>
            <Link to="/shop?offer=1">Offers</Link>
          </aside>
          <main className="product-grid">
            {d.length ? (
              d.map((p) => <ProductCard key={p.id} p={p} />)
            ) : (
              <div className="empty-state">No products found.</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export function Product() {
  const { slug } = useParams();
  const { user, refreshCart } = useApp();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  useEffect(() => {
    api(`/products/${slug}`)
      .then((r) => {
        setD(r);
        setVariant(r.variants[0] || null);
      })
      .catch(console.error);
  }, [slug]);
  if (!d) return <div className="center-screen">Loading product…</div>;
  const p = d.product;
  const price = Number(
    variant?.sale_price_override ??
      variant?.price_override ??
      p.sale_price ??
      p.price,
  );
  async function add() {
    if (!user)
      return (location.href =
        "/login?next=" + encodeURIComponent(location.pathname));
    try {
      if (!variant || variant.stock_quantity < 1) {
        alert("This product is currently out of stock.");
        return;
      }
      await api("/me/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: p.id,
          variantId: variant.id,
          quantity: qty,
        }),
      });
      await refreshCart();
      nav("/cart");
    } catch (error) {
      alert(error.message || "This product is currently out of stock.");
    }
  }
  return (
    <div className="page">
      <div className="container product-detail">
        <div className="gallery">
          <img
            className="main-image"
            src={img(d.images[0]?.image_url)}
            alt={p.name}
          />
          {d.images.length > 1 && (
            <div className="thumbs">
              {d.images.map((x) => (
                <img key={x.id} src={img(x.image_url)} alt="" />
              ))}
            </div>
          )}
        </div>
        <div className="product-copy">
          <span className="eyebrow">{p.category_name}</span>
          <h1>{p.name}</h1>
          <div className="price-row big">
            <strong>₹{price.toLocaleString("en-IN")}</strong>
            {p.sale_price && (
              <del>₹{Number(p.price).toLocaleString("en-IN")}</del>
            )}
          </div>
          <p>{p.short_description}</p>
          {d.variants.length > 0 && (
            <>
              <h4>Variation</h4>
              <div className="variant-grid">
                {d.variants.map((v) => (
                  <button
                    className={variant?.id === v.id ? "selected" : ""}
                    key={v.id}
                    onClick={() => {
                      setVariant(v);
                      setQty(1);
                    }}
                    disabled={v.stock_quantity < 1}
                  >
                    {v.size} / {v.color}
                    {v.stock_quantity < 1 ? " — OUT" : ""}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>
              <Minus />
            </button>
            <span>{qty}</span>
            <button
              onClick={() =>
                setQty(Math.min(variant?.stock_quantity || qty + 1, qty + 1))
              }
            >
              <Plus />
            </button>
          </div>
          <button className="btn btn-dark full" onClick={add}>
            ADD TO CART <ShoppingBagIcon />
          </button>
          <div className="detail-lines">
            <div>
              <strong>Material</strong>
              <span>{p.material || "—"}</span>
            </div>
            <div>
              <strong>Care</strong>
              <span>{p.care_instructions || "—"}</span>
            </div>
            <div>
              <strong>Shipping</strong>
              <span>
                {p.shipping_information || "Standard shipping available."}
              </span>
            </div>
            <div>
              <strong>Returns</strong>
              <span>
                {p.return_information || "Returns as per store policy."}
              </span>
            </div>
          </div>
        </div>
      </div>
      {d.related.length > 0 && (
        <div className="container section">
          <SectionIntro
            title="You May Also Like"
            sub="More from the CURVE edit."
          />
          <div className="product-grid">
            {d.related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function ShoppingBagIcon() {
  return <ShoppingBag />;
}

export function Cart() {
  const { user } = useApp();
  const [d, setD] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user) {
      setError("");
      api("/me/cart")
        .then((r) => setD(r.items || []))
        .catch((e) => setError(e.message));
    }
  }, [user]);
  if (!user)
    return (
      <div className="page">
        <div className="container center-panel">
          <h1>Sign in to view your cart</h1>
          <Link className="btn btn-dark" to="/login?next=/cart">
            LOGIN
          </Link>
        </div>
      </div>
    );
  const subtotal = d.reduce(
    (s, i) => s + Number(i.sale_price || i.price) * i.quantity,
    0,
  );
  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">YOUR BAG</span>
            <h1>Shopping Cart</h1>
          </div>
          <p>{d.length} item(s)</p>
        </div>
        {error && <div className="empty-state"><p>{error}</p></div>}
        {d.length ? (
          <div className="cart-layout">
            <div>
              {d.map((i) => (
                <CartItem key={i.id} item={i} setD={setD} />
              ))}
            </div>
            <aside className="summary-card">
              <h3>Summary</h3>
              <div>
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>{subtotal >= 1999 ? "FREE" : "₹99"}</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>
                  ₹
                  {(subtotal + (subtotal >= 1999 ? 0 : 99)).toLocaleString(
                    "en-IN",
                  )}
                </strong>
              </div>
              <Link className="btn btn-dark full" to="/checkout">
                CHECKOUT <ArrowRight />
              </Link>
            </aside>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Your bag is waiting.</h3>
            <Link className="btn btn-dark" to="/shop">
              SHOP COLLECTION
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
function CartItem({ item, setD }) {
  return (
    <div className="cart-item">
      <img src={img(item.image_url)} alt={item.name} />
      <div>
        <span className="eyebrow">
          {item.size} / {item.color}
        </span>
        <h3>{item.name}</h3>
        <p>₹{Number(item.sale_price || item.price).toLocaleString("en-IN")}</p>
        <div className="cart-actions">
          <button
            onClick={async () => {
              await api(`/me/cart/${item.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  quantity: Math.max(1, item.quantity - 1),
                }),
              });
              setD((await api("/me/cart")).items);
            }}
          >
            -
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={async () => {
              await api(`/me/cart/${item.id}`, {
                method: "PUT",
                body: JSON.stringify({ quantity: item.quantity + 1 }),
              });
              setD((await api("/me/cart")).items);
            }}
          >
            +
          </button>
          <button
            onClick={async () => {
              await api(`/me/cart/${item.id}`, { method: "DELETE" });
              setD((await api("/me/cart")).items);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export function Checkout() {
  const { user } = useApp();
  const nav = useNavigate();
  const [cart, setCart] = useState([]);
  const [storeSettings, setStoreSettings] = useState({
    shipping_flat_rate: "99",
    free_shipping_threshold: "1999",
    cod_enabled: "1",
    online_payment_enabled: "1",
    delivery_estimate: "3-7 business days",
  });
  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    postalCode: user?.postalCode || "",
    country: user?.country || "India",
  });
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  useEffect(() => {
    if (user) {
      api("/me/cart").then((r) => setCart(r.items));
      api("/store-settings").then((r) => {
        setStoreSettings((current) => ({ ...current, ...r.settings }));
        if (r.settings.online_payment_enabled === "1" && r.settings.cod_enabled !== "1") setPaymentMethod("ONLINE");
      });
    }
  }, [user]);
  if (!user) return <div className="center-screen">Login required.</div>;
  const subtotal = cart.reduce(
    (s, i) => s + Number(i.sale_price || i.price) * i.quantity,
    0,
  );
  const shippingRate = Number(storeSettings.shipping_flat_rate || 0);
  const freeShippingThreshold = Number(storeSettings.free_shipping_threshold || 0);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingRate;
  const total = subtotal + shipping;
  async function place() {
    try {
      if (storeSettings.cod_enabled !== "1" && storeSettings.online_payment_enabled !== "1") {
        alert("No payment method is currently available.");
        return;
      }
      const r = await api("/orders", {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: JSON.stringify({ shipping: form, couponCode }),
      });
      if (paymentMethod === "COD") {
        await api(`/payments/cod/${r.id}`, { method: "POST" });
        nav(`/order-success?order=${r.orderCode}`);
        return;
      }
      const payment = await api("/payments/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ orderId: r.id }),
      });
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load payment checkout"));
          document.body.appendChild(script);
        });
      }
      const razorpay = new window.Razorpay({
        ...razorpayUpiConfig,
        key: payment.keyId,
        order_id: payment.order.id,
        amount: payment.order.amount,
        currency: payment.order.currency,
        name: "CURVE",
        description: `Order ${r.orderCode}`,
        prefill: { name: form.name, email: form.email, contact: form.mobile },
        handler: async (result) => {
          try {
            console.info("[RAZORPAY_CHECKOUT_CALLBACK]", { internalOrderId: r.id, razorpayOrderId: result.razorpay_order_id || result.razorpayOrderId, razorpayPaymentId: result.razorpay_payment_id || result.razorpayPaymentId, signaturePresent: Boolean(result.razorpay_signature || result.razorpaySignature), signatureLength: (result.razorpay_signature || result.razorpaySignature || "").length });
            await api("/payments/razorpay/verify", {
              method: "POST",
              body: JSON.stringify({
                orderId: r.id,
                razorpayOrderId: result.razorpay_order_id || result.razorpayOrderId,
                razorpayPaymentId: result.razorpay_payment_id || result.razorpayPaymentId,
                razorpaySignature: result.razorpay_signature || result.razorpaySignature,
              }),
            });
            nav(`/order-success?order=${r.orderCode}`);
          } catch (error) {
            alert(error.message);
          }
        },
        modal: { ondismiss: async () => { await api(`/payments/${r.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Checkout dismissed" }) }).catch(() => {}); alert("Payment was not completed. The order was cancelled."); } },
      });
      logRazorpayCheckout(payment.order.id, {
        ...razorpayUpiConfig,
        key: payment.keyId,
        currency: payment.order.currency,
      });
      razorpay.open();
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <div className="page">
      <div className="container checkout">
        <div>
          <span className="eyebrow">CHECKOUT</span>
          <h1>Complete your order</h1>
          <div className="form-card">
            <div className="form-grid">
              {[
                ["name", "Full Name"],
                ["email", "Email"],
                ["mobile", "Mobile"],
                ["address", "Address"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "PIN / Postal Code"],
                ["country", "Country"],
              ].map(([k, l]) => (
                <label key={k} className={k === "address" ? "span-2" : ""}>
                  {l}
                  <input
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="notice">
              <strong>Payment</strong>
              <span>
                {storeSettings.online_payment_enabled === "1" ? "Online payment is available. " : "Online payment is currently unavailable. "}
                {storeSettings.cod_enabled === "1" ? "Cash on Delivery is available." : "Cash on Delivery is currently unavailable."}
              </span>
            </div>
            <div className="payment-options">
              <strong>Choose payment method</strong>
              {storeSettings.cod_enabled === "1" && (
                <label className="payment-option">
                  <input type="radio" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} />
                  Cash on Delivery
                </label>
              )}
              {storeSettings.online_payment_enabled === "1" && (
                <label className="payment-option">
                  <input type="radio" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={(e) => setPaymentMethod(e.target.value)} />
                  UPI (Google Pay, PhonePe and other UPI apps)
                </label>
              )}
              {storeSettings.cod_enabled !== "1" && storeSettings.online_payment_enabled !== "1" && (
                <span className="muted-text">Payment methods are currently unavailable.</span>
              )}
            </div>
            <div className="notice">
              <strong>Delivery</strong>
              <span>Estimated delivery: {storeSettings.delivery_estimate || "3-7 business days"}.</span>
            </div>
            <button className="btn btn-dark" onClick={place}>
              PLACE ORDER
            </button>
          </div>
        </div>
        <aside className="summary-card">
          <h3>Order Summary</h3>
          {cart.map((i) => (
            <div key={i.id}>
              <span>
                {i.name} × {i.quantity}
              </span>
              <strong>
                ₹
                {(Number(i.sale_price || i.price) * i.quantity).toLocaleString(
                  "en-IN",
                )}
              </strong>
            </div>
          ))}
          <div>
            <span>Shipping</span>
            <strong>{shipping ? `₹${shippingRate.toLocaleString("en-IN")}` : "FREE"}</strong>
          </div>
          <div className="coupon-row">
            <input
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ContinuePayment() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({ online_payment_enabled: "1" });
  useEffect(() => {
    Promise.all([api(`/me/orders/${id}`), api("/store-settings")])
      .then(([orderResult, settingsResult]) => {
        setOrder(orderResult.order);
        setSettings(settingsResult.settings || {});
      })
      .catch((error) => alert(error.message));
  }, [id]);
  if (!order) return <div className="center-screen">Loading payment details…</div>;
  const pending = isPaymentPending(order.payment_status);
  async function payOnline() {
    try {
      const payment = await api("/payments/razorpay/order", { method: "POST", body: JSON.stringify({ orderId: order.id }) });
      if (!window.Razorpay) await new Promise((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = resolve; script.onerror = () => reject(new Error("Unable to load payment checkout")); document.body.appendChild(script); });
      const options = { ...razorpayUpiConfig, key: payment.keyId, order_id: payment.order.id, amount: payment.order.amount, currency: payment.order.currency, name: "CURVE", description: `Order ${order.order_code}`, handler: async (result) => { try { await api("/payments/razorpay/verify", { method: "POST", body: JSON.stringify({ orderId: order.id, razorpayOrderId: result.razorpay_order_id || result.razorpayOrderId, razorpayPaymentId: result.razorpay_payment_id || result.razorpayPaymentId, razorpaySignature: result.razorpay_signature || result.razorpaySignature }) }); nav("/account?tab=orders"); } catch (error) { alert(error.message); } }, modal: { ondismiss: async () => { await api(`/payments/${order.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Payment checkout dismissed" }) }).catch(() => {}); alert("Payment was not completed. The order was cancelled."); } } };
      logRazorpayCheckout(payment.order.id, options);
      new window.Razorpay(options).open();
    } catch (error) { alert(error.message); }
  }
  async function confirmCod() {
    try { await api(`/payments/cod/${order.id}`, { method: "POST" }); alert("Cash on Delivery selected."); nav("/account?tab=orders"); } catch (error) { alert(error.message); }
  }
  return (
    <div className="page">
      <div className="container narrow-form">
        <span className="eyebrow">PAYMENT</span>
        <h1>Continue payment</h1>
        <div className="form-card">
          <h3>Order {order.order_code}</h3>
          {(order.items || []).map((item) => (
            <div className="list-row" key={item.id}>
              <span>{item.product_name} × {item.quantity}</span>
              <strong>₹{Number(item.subtotal).toLocaleString("en-IN")}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>₹{Number(order.total).toLocaleString("en-IN")}</strong>
          </div>
          {!pending ? (
            <div className="notice"><span>Payment is already {order.payment_status.toLowerCase()}.</span></div>
          ) : (
            <>
              <div className="notice"><span>Select an available payment method to complete this existing order.</span></div>
              <div className="payment-options">
                {settings.online_payment_enabled === "1" && <button className="btn btn-dark" onClick={payOnline}>PAY ONLINE</button>}
                {settings.cod_enabled === "1" && <button className="btn btn-soft" onClick={confirmCod}>CONFIRM CASH ON DELIVERY</button>}
                {settings.online_payment_enabled !== "1" && settings.cod_enabled !== "1" && <span className="muted-text">No payment method is currently enabled.</span>}
              </div>
            </>
          )}
          <Link className="btn btn-soft" to="/account?tab=orders">BACK TO ORDERS</Link>
        </div>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  async function request(e) {
    e.preventDefault();
    try {
      const r = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (r.devResetToken) {
        setToken(r.devResetToken);
        setStep("reset");
      } else alert(r.message);
    } catch (err) {
      alert(err.message);
    }
  }
  async function reset(e) {
    e.preventDefault();
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: pw }),
      });
      alert("Password reset successfully");
      location.href = "/login";
    } catch (err) {
      alert(err.message);
    }
  }
  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={step === "request" ? request : reset}
      >
        <span className="eyebrow">CURVE SECURITY</span>
        <h1>
          {step === "request" ? "Reset your password" : "Set a new password"}
        </h1>
        {step === "request" ? (
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        ) : (
          <>
            <label>
              Reset Token
              <input value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            <label>
              New Password
              <input
                type="password"
                minLength="8"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </label>
          </>
        )}
        <button className="btn btn-dark full">
          {step === "request" ? "SEND RESET REQUEST" : "RESET PASSWORD"}
        </button>
      </form>
    </div>
  );
}

export function Auth({ register = false }) {
  const { setUser } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState(
    register
      ? {
          fullName: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          termsAccepted: false,
        }
      : { email: "", password: "" },
  );
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUser(r.user);
      const next = new URLSearchParams(loc.search).get("next");
      nav(
        r.user.role === "ADMIN"
          ? "/admin"
          : next && next.startsWith("/")
            ? next
            : "/account",
      );
    } catch (err) {
      alert(err.message);
    }
  };
  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">CURVE</span>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        {register && (
          <>
            <label>
              Full Name
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label>
              Mobile
              <input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </label>
            <label>
              Address
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                City
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
              <label>
                State
                <input
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label>
                PIN
                <input
                  required
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                />
              </label>
              <label>
                Country
                <input
                  required
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </label>
            </div>
          </>
        )}
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength="8"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {register && (
          <label>
            Confirm Password
            <input
              type="password"
              required
              minLength="8"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
          </label>
        )}
        {register && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) =>
                setForm({ ...form, termsAccepted: e.target.checked })
              }
            />{" "}
            I accept the Terms & Conditions.
          </label>
        )}
        <button className="btn btn-dark full">
          {register ? "CREATE ACCOUNT" : "LOGIN"}
        </button>
        <div className="auth-links">
          {register ? (
            <Link to="/login">Already have an account?</Link>
          ) : (
            <>
              <Link to="/register">Create an account</Link> ·{" "}
              <Link to="/forgot-password">Forgot password?</Link>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export function Application() {
  const { user } = useApp();
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    postalCode: user?.postalCode || "",
    country: user?.country || "India",
    preferredCategory: "",
    preferredSize: "",
    preferredContactMethod: "Email",
    socialMedia: "",
    additionalMessage: "",
    termsAccepted: false,
  });
  if (!user)
    return (
      <div className="page">
        <div className="container center-panel">
          <h1>Login to submit your CURVE application</h1>
          <Link className="btn btn-dark" to="/login?next=/application">
            LOGIN
          </Link>
        </div>
      </div>
    );
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k !== "file") fd.append(k, v);
    });
    if (form.file) fd.append("upload", form.file);
    try {
      const r = await api("/me/applications", { method: "POST", body: fd });
      setDone(r.applicationCode);
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <div className="page">
      <div className="container narrow">
        <div className="page-head">
          <div>
            <span className="eyebrow">CURVE APPLICATION</span>
            <h1>Tell us about your style.</h1>
          </div>
          <p>
            Applications are private and visible only to you and authorized
            CURVE administrators.
          </p>
        </div>
        {done ? (
          <div className="success-card">
            <Sparkles />
            <h2>Application received</h2>
            <p>
              Your Application ID is <strong>{done}</strong>.
            </p>
            <Link className="btn btn-dark" to="/account?tab=applications">
              VIEW APPLICATION
            </Link>
          </div>
        ) : (
          <form className="form-card" onSubmit={submit}>
            <div className="form-grid">
              {[
                ["fullName", "Full Name"],
                ["email", "Email"],
                ["mobile", "Mobile"],
                ["address", "Address"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "PIN / Postal Code"],
                ["country", "Country"],
                ["preferredCategory", "Preferred Fashion Category"],
                ["preferredSize", "Preferred Size"],
                ["preferredContactMethod", "Preferred Contact Method"],
                ["socialMedia", "Instagram / Social Media"],
              ].map(([k, l]) => (
                <label key={k} className={k === "address" ? "span-2" : ""}>
                  {l}
                  <input
                    required={[
                      "fullName",
                      "email",
                      "mobile",
                      "address",
                      "city",
                      "state",
                      "postalCode",
                      "country",
                    ].includes(k)}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label className="span-2">
                Additional Message
                <textarea
                  rows="5"
                  value={form.additionalMessage}
                  onChange={(e) =>
                    setForm({ ...form, additionalMessage: e.target.value })
                  }
                />
              </label>
              <label className="span-2">
                Optional document/image
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setForm({ ...form, file: e.target.files?.[0] })
                  }
                />
              </label>
              <label className="checkbox span-2">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) =>
                    setForm({ ...form, termsAccepted: e.target.checked })
                  }
                />{" "}
                I accept the application terms.
              </label>
            </div>
            <button className="btn btn-dark">SUBMIT APPLICATION</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Account() {
  const { user, logout } = useApp();
  const [tab, setTab] = useState(
    new URLSearchParams(location.search).get("tab") || "dashboard",
  );
  const [data, setData] = useState({});
  useEffect(() => {
    Promise.all([
      api("/me/orders"),
      api("/me/wishlist"),
      api("/me/notifications"),
    ])
      .then(([o, w, n]) =>
        setData({
          orders: o.orders,
          wishlist: w.items,
          notifications: n.notifications,
        }),
      )
      .catch(console.error);
  }, []);
  return (
    <div className="page">
      <div className="container account-layout">
        <aside className="account-nav">
          <div className="account-avatar">{user.fullName?.slice(0, 1)}</div>
          <h3>{user.fullName}</h3>
          {[
            "dashboard",
            "profile",
            "orders",
            "wishlist",
            "notifications",
          ].map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x.replace("-", " ")}
            </button>
          ))}
          <button onClick={logout}>Logout</button>
        </aside>
        <main className="account-main">
          <span className="eyebrow">MY ACCOUNT</span>
          <h1>
            {tab === "dashboard"
              ? "Welcome back, " + user.fullName.split(" ")[0]
              : tab[0].toUpperCase() + tab.slice(1)}
          </h1>
          {tab === "dashboard" && (
            <div className="dashboard-cards">
              <div>
                <span>Orders</span>
                <strong>{data.orders?.length || 0}</strong>
              </div>
              <div>
                <span>Wishlist</span>
                <strong>{data.wishlist?.length || 0}</strong>
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div className="table-card">
              {data.orders?.map((o) => (
                <div className="order-history-card" key={o.id}>
                  <div className="list-row">
                    <div>
                      <strong>Order {o.order_code}</strong>
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="status">
                      {o.payment_status === "Paid" ? "Paid" : o.order_status}
                    </span>
                  </div>
                  <div className="order-history-items">
                    {(o.items || []).map((item) => (
                      <div className="order-history-item" key={item.id}>
                        <img src={img(item.image_url)} alt={item.product_name} />
                        <div>
                          <strong>{item.product_name}</strong>
                          <span>
                            {item.size || "One size"} / {item.color || "Standard"}
                            {" · "}Qty {item.quantity}
                          </span>
                        </div>
                        <strong>
                          ₹{Number(item.subtotal).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="order-history-totals">
                    <span>Subtotal ₹{Number(o.subtotal).toLocaleString("en-IN")}</span>
                    <span>Shipping {Number(o.shipping) ? `₹${Number(o.shipping).toLocaleString("en-IN")}` : "FREE"}</span>
                    {Number(o.discount) > 0 && (
                      <span>Discount -₹{Number(o.discount).toLocaleString("en-IN")}</span>
                    )}
                    <strong>Total ₹{Number(o.total).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="order-history-actions">
                    <a className="btn btn-soft" href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/me/orders/${o.id}/invoice`} download>DOWNLOAD INVOICE</a>
                  </div>
                  {isPaymentPending(o.payment_status) && (
                    <div className="order-history-actions">
                      <Link className="btn btn-soft" to={`/payment/${o.id}`}>
                        CONTINUE PAYMENT
                      </Link>
                      <button
                        className="text-link danger"
                        onClick={async () => {
                          if (!confirm("Remove this unpaid order?")) return;
                          try {
                            await api(`/me/orders/${o.id}`, { method: "DELETE" });
                            setData((current) => ({
                              ...current,
                              orders: current.orders.filter((item) => item.id !== o.id),
                            }));
                          } catch (error) {
                            alert(error.message);
                          }
                        }}
                      >
                        Remove pending order
                      </button>
                    </div>
                  )}
                  {o.order_status === "Cancelled" && (
                    <button className="text-link danger" onClick={async () => { if (!confirm("Are you sure you want to remove this cancelled order from your order history?")) return; try { await api(`/me/orders/${o.id}`, { method: "DELETE" }); setData((current) => ({ ...current, orders: current.orders.filter((item) => item.id !== o.id) })); } catch (error) { alert(error.message); } }}>DELETE CANCELLED ORDER</button>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === "wishlist" && (
            <div className="product-grid">
              {data.wishlist?.map((w) => (
                <ProductCard key={w.id} p={w} />
              ))}
            </div>
          )}
          {tab === "notifications" && (
            <div className="table-card">
              {data.notifications?.map((n) => (
                <div
                  className={`notification ${n.is_read ? "read" : ""}`}
                  key={n.id}
                >
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && <Profile user={user} />}
        </main>
      </div>
    </div>
  );
}
function Profile({ user }) {
  const { refresh } = useApp();
  const [f, setF] = useState({ ...user });
  return (
    <form
      className="form-card narrow-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await api("/me/profile", {
          method: "PUT",
          body: JSON.stringify({
            fullName: f.fullName,
            mobile: f.mobile,
            dateOfBirth: f.dateOfBirth,
            gender: f.gender,
            address: f.address,
            city: f.city,
            state: f.state,
            postalCode: f.postalCode,
            country: f.country,
          }),
        });
        await refresh();
        alert("Profile updated");
      }}
    >
      <label>
        Full Name
        <input
          value={f.fullName || ""}
          onChange={(e) => setF({ ...f, fullName: e.target.value })}
        />
      </label>
      <label>
        Mobile
        <input
          value={f.mobile || ""}
          onChange={(e) => setF({ ...f, mobile: e.target.value })}
        />
      </label>
      <label>
        Address
        <textarea
          value={f.address || ""}
          onChange={(e) => setF({ ...f, address: e.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          City
          <input
            value={f.city || ""}
            onChange={(e) => setF({ ...f, city: e.target.value })}
          />
        </label>
        <label>
          State
          <input
            value={f.state || ""}
            onChange={(e) => setF({ ...f, state: e.target.value })}
          />
        </label>
        <label>
          PIN
          <input
            value={f.postalCode || ""}
            onChange={(e) => setF({ ...f, postalCode: e.target.value })}
          />
        </label>
        <label>
          Country
          <input
            value={f.country || ""}
            onChange={(e) => setF({ ...f, country: e.target.value })}
          />
        </label>
      </div>
      <button className="btn btn-dark">SAVE PROFILE</button>
    </form>
  );
}

export function Static({ title, children }) {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    if (title !== "About CURVE" && title !== "Contact") return;
    api("/store-settings").then((result) => setSettings(result.settings || {})).catch(console.error);
  }, [title]);
  const isAbout = title === "About CURVE";
  const managedTitle = isAbout ? settings.about_title : settings.contact_business_name;
  const managedBody = isAbout
    ? settings.about_content
    : [settings.contact_address, settings.contact_city, settings.contact_state, settings.contact_country, settings.contact_postal_code].filter(Boolean).join(", ");
  return (
    <div className="page">
      <div className="container narrow content-page">
        <span className="eyebrow">CURVE</span>
        <h1>{managedTitle || title}</h1>
        {managedBody ? <p>{managedBody}</p> : children || (
          <p>
            This page is editable through the Admin Panel in the production
            version.
          </p>
        )}
        {!isAbout && (settings.contact_phone || settings.contact_email || settings.contact_whatsapp || settings.contact_hours) && (
          <p>{[settings.contact_phone, settings.contact_email, settings.contact_whatsapp, settings.contact_hours].filter(Boolean).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
