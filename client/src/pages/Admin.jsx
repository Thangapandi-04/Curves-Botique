import React, { useEffect, useState } from "react";
import { api, img } from "../api";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Layers,
  Image as ImageIcon,
  Video,
  Tags,
  Star,
  Settings,
  Menu,
  X,
  Save,
  Trash2,
  Bell,
} from "lucide-react";
import { useApp } from "../context";
const tabs = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["products", "Products", Package],
  ["new-arrivals", "New Arrivals", Package],
  ["best-sellers", "Best Sellers", Package],
  ["categories", "Categories", Layers],
  ["orders", "Orders", ShoppingCart],
  ["notifications", "Notifications", Bell],
  ["customers", "Customers", Users],
  ["carousel", "Carousel", ImageIcon],
  ["videos", "Videos", Video],
  ["homepage", "Homepage", Layers],
  ["promotions", "Promotions", ImageIcon],
  ["reviews", "Reviews", Star],
  ["discounts", "Discounts", Tags],
  ["media", "Media", ImageIcon],
  ["settings", "Settings", Settings],
];
async function downloadOrdersCsv() {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/orders/export.csv`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Unable to export orders");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = "curve-orders.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
function AssetField({ label, value, onChange, accept }) {
  const [uploading, setUploading] = useState(false);
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("altText", label);
      const result = await api("/admin/media", { method: "POST", body: form });
      onChange(result.fileUrl);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  return (
    <label>
      {label}
      <input type="file" accept={accept} onChange={upload} disabled={uploading} />
      <small>{uploading ? "Uploading..." : value ? "File selected" : "Choose a file"}</small>
    </label>
  );
}
export default function Admin() {
  const { logout } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({});
  const [mobile, setMobile] = useState(false);
  const [codPendingCount, setCodPendingCount] = useState(0);
  async function loadCodPendingCount() {
    try {
      const r = await api("/admin/stats");
      setCodPendingCount(r.codPendingCount || 0);
    } catch {}
  }
  useEffect(() => {
    loadCodPendingCount();
  }, []);
  async function load() {
    const endpoints = {
      dashboard: "/admin/stats",
      products: "/admin/products",
      "new-arrivals": "/admin/products",
      "best-sellers": "/admin/products",
      categories: "/admin/categories",
      orders: "/admin/orders",
      notifications: "/me/notifications",
      customers: "/admin/customers",
      reviews: "/admin/reviews",
      discounts: "/admin/coupons",
      media: "/admin/media",
      homepage: "/admin/content",
      promotions: "/admin/content",
      carousel: "/admin/content",
      videos: "/admin/content",
      settings: "/admin/content",
    };
    const e = endpoints[tab] || endpoints.dashboard;
    try {
      const r = await api(e);
      if (tab === "reviews") r.users = (await api("/admin/review-users")).users;
      setData(r);
      if (tab === "orders") loadCodPendingCount();
    } catch (err) {
      alert(err.message);
    }
  }
  useEffect(() => {
    load();
  }, [tab]);
  return (
    <div className="admin-shell">
      <button className="admin-mobile" onClick={() => setMobile(!mobile)}>
        {mobile ? <X /> : <Menu />}
      </button>
      <aside className={`admin-side ${mobile ? "open" : ""}`}>
        <div className="admin-brand">
          CURVE<span>.</span>
          <small>ADMIN</small>
        </div>
        {tabs.map(([k, l, I]) => (
          <button
            className={tab === k ? "active" : ""}
            onClick={() => {
              setTab(k);
              setMobile(false);
            }}
            key={k}
          >
            <I size={17} />
            {l}
            {k === "orders" && codPendingCount > 0 && (
              <span className="nav-badge" title="COD orders awaiting payment collection">
                {codPendingCount}
              </span>
            )}
          </button>
        ))}
      </aside>
      <main className="admin-main">
        <div className="admin-head">
          <div>
            <span className="eyebrow">CONTROL CENTER</span>
            <h1>{tabs.find((x) => x[0] === tab)?.[1]}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-soft" onClick={load}>
              Refresh
            </button>
            <button
              className="btn btn-dark"
              onClick={async () => {
                await logout();
                location.href = "/login";
              }}
            >
              Logout
            </button>
            {tab === "orders" && (
              <button
                className="btn btn-dark"
                onClick={async () => {
                  try {
                    await downloadOrdersCsv();
                  } catch (error) {
                    alert(error.message);
                  }
                }}
              >
                Export CSV
              </button>
            )}
          </div>
        </div>
        {tab === "dashboard" && <Dashboard d={data} />}{" "}
        {tab === "products" && <Products d={data} reload={load} />}{" "}
        {tab === "new-arrivals" && (
          <Products d={data} reload={load} initialHomepageFilter="new-arrivals" />
        )} {" "}
        {tab === "best-sellers" && (
          <Products d={data} reload={load} initialHomepageFilter="best-sellers" />
        )} {" "}
        {tab === "categories" && <Categories d={data} reload={load} />}{" "}
        {tab === "orders" && (
          <Orders d={data} reload={load} codPendingCount={codPendingCount} />
        )}{" "}
        {tab === "notifications" && <AdminNotifications d={data} />}{" "}
        {tab === "customers" && <Customers d={data} reload={load} />}{" "}
        {tab === "carousel" && <Carousel d={data} reload={load} />}{" "}
        {tab === "videos" && <Videos d={data} reload={load} />}{" "}
        {tab === "homepage" && <Homepage d={data} reload={load} />}{" "}
        {tab === "promotions" && <Promotions d={data} reload={load} />}{" "}
        {tab === "reviews" && <Reviews d={data} reload={load} />}{" "}
        {tab === "discounts" && <Coupons d={data} reload={load} />}{" "}
        {tab === "media" && <Media d={data} reload={load} />}{" "}
        {tab === "settings" && <SettingsPanel d={data} reload={load} />}
      </main>
    </div>
  );
}
function Dashboard({ d }) {
  return (
    <div className="admin-grid">
      <Metric t="Products" v={d.products} />
      <Metric t="Customers" v={d.customers} />
      <Metric t="Orders" v={d.orders} />
      <Metric t="Pending Orders" v={d.pendingOrders} />
      <Metric t="Low Stock" v={d.lowStock} />
    </div>
  );
}
function Metric({ t, v }) {
  return (
    <div className="metric">
      <span>{t}</span>
      <strong>{v ?? "—"}</strong>
    </div>
  );
}
function Products({ d, reload, initialHomepageFilter = "all" }) {
  const empty = {
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    shortDescription: "",
    price: 0,
    salePrice: "",
    material: "",
    featured: false,
    newArrival: false,
    bestSeller: false,
    offer: false,
    active: true,
    displayOrder: 0,
    images: [{ imageUrl: "", altText: "", displayOrder: 0 }],
    variants: [{ size: "M", color: "Black", sku: "", stockQuantity: 0 }],
  };
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [homepageFilter, setHomepageFilter] = useState(initialHomepageFilter);
  const categoriesState = useState([]);
  useEffect(() => {
    setHomepageFilter(initialHomepageFilter);
  }, [initialHomepageFilter]);
  useEffect(() => {
    api("/admin/categories").then((r) => categoriesState[1](r.categories));
  }, []);
  async function save() {
    try {
      await api(editing ? `/admin/products/${editing}` : "/admin/products", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...f,
          id: editing,
          newArrival: homepageFilter === "new-arrivals" || f.newArrival,
          bestSeller: homepageFilter === "best-sellers" || f.bestSeller,
        }),
      });
      setF(empty);
      setEditing(null);
      reload();
    } catch (error) {
      alert(error.message);
    }
  }
  const products = (d.products || []).filter((product) =>
    homepageFilter === "new-arrivals"
      ? Boolean(product.new_arrival)
      : homepageFilter === "best-sellers"
        ? Boolean(product.best_seller)
        : true,
  );
  return (
    <>
      <div className="admin-card">
        <div className="admin-card-head">
          <h3>{editing ? "Edit Product" : "Add Product"}</h3>
          <button className="btn btn-dark" onClick={save}>
            <Save size={16} /> Save Product
          </button>
        </div>
        <div className="form-grid">
          <label>
            Name
            <input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </label>
          <label>
            SKU
            <input
              value={f.sku}
              onChange={(e) => setF({ ...f, sku: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={f.categoryId}
              onChange={(e) => setF({ ...f, categoryId: e.target.value })}
            >
              <option value="">Select</option>
              {categoriesState[0].map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price
            <input
              type="number"
              value={f.price}
              onChange={(e) => setF({ ...f, price: e.target.value })}
            />
          </label>
          <label>
            Sale Price
            <input
              type="number"
              value={f.salePrice}
              onChange={(e) => setF({ ...f, salePrice: e.target.value })}
            />
          </label>
          <label>
            Material
            <input
              value={f.material}
              onChange={(e) => setF({ ...f, material: e.target.value })}
            />
          </label>
          <label>
            Care Instructions
            <textarea
              value={f.careInstructions || ""}
              onChange={(e) => setF({ ...f, careInstructions: e.target.value })}
            />
          </label>
          <label>
            Shipping Information
            <textarea
              value={f.shippingInformation || ""}
              onChange={(e) =>
                setF({ ...f, shippingInformation: e.target.value })
              }
            />
          </label>
          <label className="span-2">
            Return Information
            <textarea
              value={f.returnInformation || ""}
              onChange={(e) => setF({ ...f, returnInformation: e.target.value })}
            />
          </label>
          <label className="span-2">
            Short Description
            <input
              value={f.shortDescription}
              onChange={(e) => setF({ ...f, shortDescription: e.target.value })}
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </label>
          <div className="span-2">
            <h4>Product Images</h4>
            {f.images.map((image, i) => (
              <div className="variant-row" key={i}>
                <AssetField
                  label={
                    i === 0
                      ? "Primary image (shown first)"
                      : i === 1
                        ? "Hover image (shown on hover)"
                        : `Additional image ${i + 1}`
                  }
                  value={image.imageUrl}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(imageUrl) => {
                    const images = [...f.images];
                    images[i] = { ...image, imageUrl };
                    setF({ ...f, images });
                  }}
                />
                <input
                  placeholder="Alt text"
                  value={image.altText}
                  onChange={(e) => {
                    const images = [...f.images];
                    images[i] = { ...image, altText: e.target.value };
                    setF({ ...f, images });
                  }}
                />
                <button
                  className="icon-btn"
                  onClick={() =>
                    setF({
                      ...f,
                      images: f.images.filter((_, x) => x !== i),
                    })
                  }
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            <button
              className="line-btn"
              onClick={() =>
                setF({
                  ...f,
                  images: [
                    ...f.images,
                    { imageUrl: "", altText: "", displayOrder: f.images.length },
                  ],
                })
              }
            >
              + Add product image
            </button>
          </div>
          <label>
            Featured
            <input
              type="checkbox"
              checked={f.featured}
              onChange={(e) => setF({ ...f, featured: e.target.checked })}
            />
          </label>
          <label>
            New Arrival
            <input
              type="checkbox"
              checked={f.newArrival}
              onChange={(e) => setF({ ...f, newArrival: e.target.checked })}
            />
          </label>
          <label>
            Best Seller
            <input
              type="checkbox"
              checked={f.bestSeller}
              onChange={(e) => setF({ ...f, bestSeller: e.target.checked })}
            />
          </label>
          <label>
            Offer
            <input
              type="checkbox"
              checked={f.offer}
              onChange={(e) => setF({ ...f, offer: e.target.checked })}
            />
          </label>
        </div>
        <h4>Variations</h4>
        {f.variants.map((v, i) => (
          <div className="variant-row" key={i}>
            <input
              placeholder="Size"
              value={v.size}
              onChange={(e) => {
                const a = [...f.variants];
                a[i] = { ...v, size: e.target.value };
                setF({ ...f, variants: a });
              }}
            />
            <input
              placeholder="Color"
              value={v.color}
              onChange={(e) => {
                const a = [...f.variants];
                a[i] = { ...v, color: e.target.value };
                setF({ ...f, variants: a });
              }}
            />
            <input
              placeholder="SKU"
              value={v.sku}
              onChange={(e) => {
                const a = [...f.variants];
                a[i] = { ...v, sku: e.target.value };
                setF({ ...f, variants: a });
              }}
            />
            <input
              type="number"
              placeholder="Stock"
              value={v.stockQuantity}
              onChange={(e) => {
                const a = [...f.variants];
                a[i] = { ...v, stockQuantity: e.target.value };
                setF({ ...f, variants: a });
              }}
            />
            <button
              className="icon-btn"
              onClick={() =>
                setF({ ...f, variants: f.variants.filter((_, x) => x !== i) })
              }
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <button
          className="line-btn"
          onClick={() =>
            setF({
              ...f,
              variants: [
                ...f.variants,
                { size: "M", color: "Black", sku: "", stockQuantity: 0 },
              ],
            })
          }
        >
          + Add variation
        </button>
      </div>
      <div className="admin-card-head">
        <h3>Homepage Product Sections</h3>
        <select
          value={homepageFilter}
          onChange={(e) => setHomepageFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="new-arrivals">New Arrivals</option>
          <option value="best-sellers">Best Sellers</option>
        </select>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>New Arrival</th>
              <th>Best Seller</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>{p.sku}</td>
                <td>
                  ₹{Number(p.sale_price || p.price).toLocaleString("en-IN")}
                </td>
                <td>{p.new_arrival ? "Yes" : "No"}</td>
                <td>{p.best_seller ? "Yes" : "No"}</td>
                <td>{p.active ? "Active" : "Disabled"}</td>
                <td>
                  <button
                    className="text-link"
                    onClick={() => {
                      setEditing(p.id);
                      setF({
                        name: p.name || "",
                        sku: p.sku || "",
                        categoryId: p.category_id || "",
                        description: p.description || "",
                        shortDescription: p.short_description || "",
                        price: p.price || 0,
                        salePrice: p.sale_price || "",
                        material: p.material || "",
                        careInstructions: p.care_instructions || "",
                        shippingInformation: p.shipping_information || "",
                        returnInformation: p.return_information || "",
                        featured: Boolean(p.featured),
                        newArrival: Boolean(p.new_arrival),
                        bestSeller: Boolean(p.best_seller),
                        offer: Boolean(p.offer),
                        active: Boolean(p.active),
                        displayOrder: p.display_order || 0,
                        images: (p.images || []).map((image) => ({
                          imageUrl: image.image_url || "",
                          altText: image.alt_text || "",
                          displayOrder: image.display_order || 0,
                        })),
                        variants: (p.variants || []).map((variant) => ({
                          size: variant.size || "",
                          color: variant.color || "",
                          sku: variant.sku || "",
                          priceOverride: variant.price_override ?? "",
                          salePriceOverride: variant.sale_price_override ?? "",
                          stockQuantity: variant.stock_quantity ?? 0,
                          active: variant.active !== false,
                        })),
                      });
                    }}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="text-link danger"
                    onClick={async () => {
                      if (confirm("Delete product?")) {
                        await api(`/admin/products/${p.id}`, {
                          method: "DELETE",
                        });
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Categories({ d, reload }) {
  const [f, setF] = useState({
    name: "",
    description: "",
    imageUrl: "",
    displayOrder: 0,
    isActive: true,
  });
  const [editing, setEditing] = useState(null);
  async function save() {
    await api(editing ? `/admin/categories/${editing}` : "/admin/categories", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(f),
    });
    setF({ name: "", description: "", imageUrl: "", displayOrder: 0, isActive: true });
    setEditing(null);
    reload();
  }
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{editing ? "Edit Category" : "Categories"}</h3>
        <button className="btn btn-dark" onClick={save}>
          {editing ? "Save Category" : "Add Category"}
        </button>
      </div>
      <div className="form-grid">
        <input
          placeholder="Name"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <AssetField
          label="Category image"
          value={f.imageUrl}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(imageUrl) => setF({ ...f, imageUrl })}
        />
        <input
          placeholder="Description"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Display order"
          value={f.displayOrder}
          onChange={(e) => setF({ ...f, displayOrder: e.target.value })}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          /> Active
        </label>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Order</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(d.categories || []).map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.display_order}</td>
                <td>{c.is_active ? "Active" : "Disabled"}</td>
                <td>
                  <button
                    className="text-link"
                    onClick={() => {
                      setEditing(c.id);
                      setF({
                        name: c.name,
                        description: c.description || "",
                        imageUrl: c.image_url || "",
                        displayOrder: c.display_order || 0,
                        isActive: Boolean(c.is_active),
                      });
                    }}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="text-link danger"
                    onClick={async () => {
                      if (confirm("Delete category?")) {
                        await api(`/admin/categories/${c.id}`, {
                          method: "DELETE",
                        });
                        reload();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function AdminNotifications({ d }) {
  return (
    <div className="table-card">
      {!(d.notifications || []).length && <p>No notifications yet.</p>}
      {(d.notifications || []).map((n) => (
        <div className={`notification ${n.is_read ? "read" : ""}`} key={n.id}>
          <strong>{n.title}</strong>
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString("en-IN")}</small>
        </div>
      ))}
    </div>
  );
}
function Orders({ d, reload, codPendingCount = 0 }) {
  const statuses = [
    "Pending",
    "Payment Pending",
    "Paid",
    "Processing",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Returned",
    "Refunded",
  ];
  async function collectCodPayment(orderId) {
    if (!confirm("Confirm that COD payment has actually been collected for this order?")) return;
    try {
      await api(`/admin/orders/${orderId}/collect-cod-payment`, { method: "POST" });
      reload();
    } catch (error) {
      alert(error.message);
    }
  }
  return (
    <div className="table-card">
      {codPendingCount > 0 && (
        <p className="cod-pending-banner">
          COD Pending: <strong>{codPendingCount}</strong> order(s) awaiting payment collection
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Payment Type</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(d.orders || []).map((o) => (
            <tr key={o.id}>
              <td>{o.order_code}</td>
              <td>{o.full_name}</td>
              <td>₹{Number(o.total).toLocaleString("en-IN")}</td>
              <td>
                {o.payment_status}
                {o.payment_type === "COD" && o.cod_payment_status && (
                  <div>
                    <span className="status">
                      {o.cod_payment_status === "cod_paid" ? "COD_PAID" : "COD_PENDING"}
                    </span>
                  </div>
                )}
              </td>
              <td>{o.payment_type === "COD" ? "COD" : "Razorpay"}</td>
              <td>
                <select
                  value={o.order_status}
                  onChange={async (e) => {
                    await api(`/admin/orders/${o.id}`, {
                      method: "PUT",
                      body: JSON.stringify({
                        orderStatus: e.target.value,
                        paymentStatus: o.payment_status,
                      }),
                    });
                    reload();
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                {o.email}{" "}
                <a className="text-link" href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/orders/${o.id}/invoice`} download>Invoice</a>
                {o.payment_type === "COD" && o.cod_payment_status === "cod_pending" && (
                  <button className="text-link" onClick={() => collectCodPayment(o.id)}>
                    Mark COD Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Customers({ d, reload }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(d.customers || []).map((c) => (
            <tr key={c.id}>
              <td>{c.full_name}</td>
              <td>{c.email}</td>
              <td>{c.mobile}</td>
              <td>{c.is_active ? "Yes" : "No"}</td>
              <td>
                <button
                  className="text-link"
                  onClick={async () => {
                    await api(`/admin/customers/${c.id}/status`, {
                      method: "PUT",
                      body: JSON.stringify({ isActive: !c.is_active }),
                    });
                    reload();
                  }}
                >
                  {c.is_active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Applications({ d, reload }) {
  const statuses = [
    "Submitted",
    "Under Review",
    "Approved",
    "Rejected",
    "More Information Required",
    "Completed",
  ];
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Applicant</th>
            <th>Email</th>
            <th>Created</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(d.applications || []).map((a) => (
            <tr key={a.id}>
              <td>{a.application_code}</td>
              <td>{a.full_name}</td>
              <td>{a.email}</td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
              <td>
                <select
                  value={a.status}
                  onChange={async (e) => {
                    const adminComment =
                      prompt(
                        "Admin comment (optional):",
                        a.admin_comment || "",
                      ) ??
                      (a.admin_comment || "");
                    await api(`/admin/applications/${a.id}`, {
                      method: "PUT",
                      body: JSON.stringify({
                        status: e.target.value,
                        adminComment,
                      }),
                    });
                    reload();
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Carousel({ d, reload }) {
  const [f, setF] = useState({
    title: "",
    subtitle: "",
    buttonText: "SHOP NOW",
    buttonUrl: "/shop",
    imageUrl: "",
    displayOrder: 1,
    isActive: true,
  });
  const [editing, setEditing] = useState(null);
  const slides = d.slides || [];
  async function save() {
    await api(editing ? `/admin/slides/${editing}` : "/admin/slides", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(f),
    });
    setF({
      title: "",
      subtitle: "",
      buttonText: "SHOP NOW",
      buttonUrl: "/shop",
      imageUrl: "",
      displayOrder: 1,
      isActive: true,
    });
    setEditing(null);
    reload();
  }
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{editing ? "Edit Slide" : "Hero / Carousel"}</h3>
        <button className="btn btn-dark" onClick={save}>
          {editing ? "Save Slide" : "Add Slide"}
        </button>
      </div>
      <div className="form-grid">
        <input
          placeholder="Title"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <input
          placeholder="Subtitle"
          value={f.subtitle}
          onChange={(e) => setF({ ...f, subtitle: e.target.value })}
        />
        <input
          placeholder="Button text"
          value={f.buttonText}
          onChange={(e) => setF({ ...f, buttonText: e.target.value })}
        />
        <input
          placeholder="Button URL"
          value={f.buttonUrl}
          onChange={(e) => setF({ ...f, buttonUrl: e.target.value })}
        />
        <AssetField
          label="Hero image"
          value={f.imageUrl}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(imageUrl) => setF({ ...f, imageUrl })}
        />
        <input
          type="number"
          placeholder="Display order"
          value={f.displayOrder}
          onChange={(e) => setF({ ...f, displayOrder: e.target.value })}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          /> Active
        </label>
      </div>
      <div className="content-list">
        {slides.map((s) => (
          <div className="content-item" key={s.id}>
            <img src={img(s.image_url)} alt="" />
            <div>
              <strong>{s.title}</strong>
              <span>{s.subtitle}</span>
            </div>
            <button
              className="text-link"
              onClick={() => {
                setEditing(s.id);
                setF({
                  title: s.title || "",
                  subtitle: s.subtitle || "",
                  buttonText: s.button_text || "SHOP NOW",
                  buttonUrl: s.button_url || "/shop",
                  imageUrl: s.image_url || "",
                  displayOrder: s.display_order || 0,
                  isActive: Boolean(s.is_active),
                });
              }}
            >
              Edit
            </button>
            <button
              className="text-link danger"
              onClick={async () => {
                await api(`/admin/slides/${s.id}`, { method: "DELETE" });
                reload();
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Videos({ d, reload }) {
  const [f, setF] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    destinationUrl: "/shop",
    displayOrder: 1,
    isActive: true,
  });
  const [editing, setEditing] = useState(null);
  async function save() {
    await api(editing ? `/admin/videos/${editing}` : "/admin/videos", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(f),
    });
    setF({
      title: "",
      description: "",
      thumbnailUrl: "",
      videoUrl: "",
      destinationUrl: "/shop",
      displayOrder: 1,
      isActive: true,
    });
    setEditing(null);
    reload();
  }
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{editing ? "Edit Video" : "Fashion Videos"}</h3>
        <button className="btn btn-dark" onClick={save}>
          {editing ? "Save Video" : "Add Video"}
        </button>
      </div>
      <div className="form-grid">
        <input
          placeholder="Title"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <AssetField
          label="Video thumbnail"
          value={f.thumbnailUrl}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(thumbnailUrl) => setF({ ...f, thumbnailUrl })}
        />
        <AssetField
          label="Video file"
          value={f.videoUrl}
          accept="video/mp4,video/webm,video/ogg"
          onChange={(videoUrl) => setF({ ...f, videoUrl })}
        />
        <input
          placeholder="Destination URL"
          value={f.destinationUrl}
          onChange={(e) => setF({ ...f, destinationUrl: e.target.value })}
        />
        <input
          type="number"
          placeholder="Display order"
          value={f.displayOrder}
          onChange={(e) => setF({ ...f, displayOrder: e.target.value })}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          /> Active
        </label>
      </div>
      <div className="content-list">
        {(d.videos || []).map((v) => (
          <div className="content-item" key={v.id}>
            <img src={img(v.thumbnail_url)} alt="" />
            <div>
              <strong>{v.title}</strong>
              <span>{v.description}</span>
            </div>
            <button
              className="text-link"
              onClick={() => {
                setEditing(v.id);
                setF({
                  title: v.title || "",
                  description: v.description || "",
                  thumbnailUrl: v.thumbnail_url || "",
                  videoUrl: v.video_url || "",
                  destinationUrl: v.destination_url || "/shop",
                  displayOrder: v.display_order || 0,
                  isActive: Boolean(v.is_active),
                });
              }}
            >
              Edit
            </button>
            <button
              className="text-link danger"
              onClick={async () => {
                await api(`/admin/videos/${v.id}`, { method: "DELETE" });
                reload();
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Reviews({ d, reload }) {
  const empty = { userId: "", customerName: "", rating: 5, reviewText: "", imageUrl: "", status: "Approved", displayOrder: 0 };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const submit = async (event) => { event.preventDefault(); await api(editing ? `/admin/reviews/${editing}` : "/admin/reviews", { method: editing ? "PUT" : "POST", body: JSON.stringify(form) }); setForm(empty); setEditing(null); reload(); };
  return (
    <div>
      <form className="admin-card" onSubmit={submit}>
        <div className="admin-card-head"><h3>{editing ? "Edit Review" : "Add Review"}</h3><button className="btn btn-dark" type="submit">{editing ? "Save Review" : "Add Review"}</button></div>
        <div className="form-grid">
          <label>Customer name<input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
          <label>Customer/user<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}><option value="">No linked user</option>{(d.users || []).map((user) => <option value={user.id} key={user.id}>{user.full_name} ({user.email})</option>)}</select></label>
          <label>Rating<select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[1,2,3,4,5].map((rating) => <option key={rating}>{rating}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>Approved</option><option>Rejected</option></select></label>
          <label className="span-2">Review content<textarea required value={form.reviewText} onChange={(e) => setForm({ ...form, reviewText: e.target.value })} /></label>
          <label>Image URL<input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></label>
          <label>Display order<input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} /></label>
        </div>
        {editing && <button type="button" className="text-link" onClick={() => { setEditing(null); setForm(empty); }}>Cancel edit</button>}
      </form>
      <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(d.reviews || []).map((r) => (
            <tr key={r.id}>
              <td>{r.customer_name}</td>
              <td>{r.rating}/5</td>
              <td>{r.review_text}</td>
              <td>
                <select
                  value={r.status}
                  onChange={async (e) => {
                    await api(`/admin/reviews/${r.id}`, {
                      method: "PUT",
                      body: JSON.stringify({
                        status: e.target.value,
                        displayOrder: r.display_order,
                      }),
                    });
                    reload();
                  }}
                >
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </td>
              <td>
                <button className="text-link" onClick={() => { setEditing(r.id); setForm({ userId: r.user_id || "", customerName: r.customer_name, rating: r.rating, reviewText: r.review_text, imageUrl: r.image_url || "", status: r.status, displayOrder: r.display_order || 0 }); }}>Edit</button>{" "}
                <button
                  className="text-link danger"
                  onClick={async () => {
                    await api(`/admin/reviews/${r.id}`, { method: "DELETE" });
                    reload();
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
function Coupons({ d, reload }) {
  const [f, setF] = useState({
    code: "",
    type: "PERCENTAGE",
    value: 10,
    minOrderValue: 0,
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    active: true,
  });
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>Discounts & Coupons</h3>
        <button
          className="btn btn-dark"
          onClick={async () => {
            await api("/admin/coupons", {
              method: "POST",
              body: JSON.stringify(f),
            });
            reload();
          }}
        >
          Create Coupon
        </button>
      </div>
      <div className="form-grid">
        <input
          placeholder="Code"
          value={f.code}
          onChange={(e) => setF({ ...f, code: e.target.value })}
        />
        <select
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value })}
        >
          <option>PERCENTAGE</option>
          <option>FIXED</option>
        </select>
        <input
          type="number"
          placeholder="Value"
          value={f.value}
          onChange={(e) => setF({ ...f, value: e.target.value })}
        />
        <input
          type="number"
          placeholder="Minimum order"
          value={f.minOrderValue}
          onChange={(e) => setF({ ...f, minOrderValue: e.target.value })}
        />
        <input
          type="datetime-local"
          value={f.expiresAt}
          onChange={(e) => setF({ ...f, expiresAt: e.target.value })}
        />
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Expiry</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(d.coupons || []).map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.type}</td>
                <td>{c.value}</td>
                <td>
                  {c.expires_at ? new Date(c.expires_at).toLocaleString() : "—"}
                </td>
                <td>{c.active ? "Yes" : "No"}</td>
                <td>
                  <button
                    className="text-link danger"
                    onClick={async () => {
                      await api(`/admin/coupons/${c.id}`, { method: "DELETE" });
                      reload();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function SettingsPanel({ d, reload }) {
  const settingLabels = {
    shipping_flat_rate: "Shipping fee",
    free_shipping_threshold: "Free shipping above",
    cod_enabled: "Cash on Delivery enabled (1/0)",
    online_payment_enabled: "Online payment enabled (1/0)",
    delivery_estimate: "Estimated delivery time",
    about_title: "About title",
    about_content: "About content",
    about_image: "About image URL",
    contact_business_name: "Contact business name",
    contact_phone: "Contact phone",
    contact_email: "Contact email",
    contact_whatsapp: "WhatsApp number",
    contact_address: "Business address",
    contact_city: "Business city",
    contact_state: "Business state",
    contact_country: "Business country",
    contact_postal_code: "Business postal code",
    contact_hours: "Business hours",
    contact_social_links: "Social media links",
  };
  const defaultSettings = {
    shipping_flat_rate: "99",
    free_shipping_threshold: "1999",
    cod_enabled: "1",
    online_payment_enabled: "1",
    delivery_estimate: "3-7 business days",
    about_title: "About CURVE",
    about_content: "CURVE is a premium women's fashion boutique focused on timeless Indian fashion, refined silhouettes and a considered customer experience.",
    contact_business_name: "CURVE",
    contact_phone: "+91 90000 00000",
    contact_email: "hello@curve.example",
    contact_address: "Chennai",
    contact_state: "Tamil Nadu",
    contact_country: "India",
  };
  const [f, setF] = useState(
    { ...defaultSettings, ...Object.fromEntries((d.settings || []).map((s) => [s.key, s.value])) },
  );
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>Store Settings</h3>
        <button
          className="btn btn-dark"
          onClick={async () => {
            await api("/admin/settings", {
              method: "PUT",
              body: JSON.stringify(f),
            });
            reload();
            alert("Settings saved");
          }}
        >
          Save Settings
        </button>
      </div>
      <div className="form-grid">
        {Object.entries(f).map(([k, v]) => (
          <label key={k}>
            {settingLabels[k] || k.replaceAll("_", " ")}
            <input
              value={v ?? ""}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function Homepage({ d, reload }) {
  const [f, setF] = useState({
    section_key: "",
    title: "",
    subtitle: "",
    body: "",
    image_url: "",
    display_order: 1,
    is_active: 1,
  });
  const [sections, setSections] = useState(d.sections || []);
  useEffect(() => setSections(d.sections || []), [d.sections]);
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>Homepage Section Visibility & Content</h3>
      </div>
      <div className="content-list">
        {sections.map((s) => (
          <div className="content-item" key={s.id}>
            <div>
              <strong>{s.section_key.replaceAll("_", " ")}</strong>
              <span>{s.title || "Section"}</span>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!!s.is_active}
                onChange={async (e) => {
                  await api("/admin/settings", {
                    method: "PUT",
                    body: JSON.stringify({
                      ["homepage_" + s.section_key + "_active"]: e.target
                        .checked
                        ? "1"
                        : "0",
                    }),
                  });
                  setSections(
                    sections.map((x) =>
                      x.id === s.id
                        ? { ...x, is_active: e.target.checked ? 1 : 0 }
                        : x,
                    ),
                  );
                }}
              />{" "}
              Active
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
function Promotions({ d, reload }) {
  const [f, setF] = useState({
    title: "",
    subtitle: "",
    buttonText: "SHOP NOW",
    buttonUrl: "/shop",
    imageUrl: "",
    displayOrder: 1,
    isActive: true,
  });
  const [editing, setEditing] = useState(null);
  async function save() {
    await api(editing ? `/admin/banners/${editing}` : "/admin/banners", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(f),
    });
    setF({
      title: "",
      subtitle: "",
      buttonText: "SHOP NOW",
      buttonUrl: "/shop",
      imageUrl: "",
      displayOrder: 1,
      isActive: true,
    });
    setEditing(null);
    reload();
  }
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>{editing ? "Edit Banner" : "Promotional Banners"}</h3>
        <button className="btn btn-dark" onClick={save}>
          {editing ? "Save Banner" : "Add Banner"}
        </button>
      </div>
      <div className="form-grid">
        <input
          placeholder="Title"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <input
          placeholder="Subtitle"
          value={f.subtitle}
          onChange={(e) => setF({ ...f, subtitle: e.target.value })}
        />
        <input
          placeholder="Button text"
          value={f.buttonText}
          onChange={(e) => setF({ ...f, buttonText: e.target.value })}
        />
        <input
          placeholder="Button URL"
          value={f.buttonUrl}
          onChange={(e) => setF({ ...f, buttonUrl: e.target.value })}
        />
        <AssetField
          label="Banner image"
          value={f.imageUrl}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(imageUrl) => setF({ ...f, imageUrl })}
        />
        <input
          type="number"
          placeholder="Display order"
          value={f.displayOrder}
          onChange={(e) => setF({ ...f, displayOrder: e.target.value })}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          /> Active
        </label>
      </div>
      <div className="content-list">
        {(d.banners || []).map((b) => (
          <div className="content-item" key={b.id}>
            <img src={img(b.image_url)} alt="" />
            <div>
              <strong>{b.title}</strong>
              <span>{b.subtitle}</span>
            </div>
            <button
              className="text-link"
              onClick={() => {
                setEditing(b.id);
                setF({
                  title: b.title || "",
                  subtitle: b.subtitle || "",
                  buttonText: b.button_text || "SHOP NOW",
                  buttonUrl: b.button_url || "/shop",
                  imageUrl: b.image_url || "",
                  displayOrder: b.display_order || 0,
                  isActive: Boolean(b.is_active),
                });
              }}
            >
              Edit
            </button>
            <button
              className="text-link danger"
              onClick={async () => {
                await api(`/admin/banners/${b.id}`, { method: "DELETE" });
                reload();
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function Media({ d, reload }) {
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState("");
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3>Media Library</h3>
        <button
          className="btn btn-dark"
          onClick={async () => {
            if (!file) return alert("Choose an image or PDF");
            const fd = new FormData();
            fd.append("file", file);
            fd.append("altText", alt);
            await api("/admin/media", { method: "POST", body: fd });
            setFile(null);
            setAlt("");
            reload();
          }}
        >
          Upload
        </button>
      </div>
      <div className="form-grid">
        <label>
          File
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Alt text
          <input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </label>
      </div>
      <div className="content-list">
        {(d.media || []).map((m) => (
          <div className="content-item" key={m.id}>
            <div>
              <strong>{m.original_name}</strong>
              <span>
                {m.mime_type} · {Math.round(m.size_bytes / 1024)} KB
              </span>
              <span>{m.file_url}</span>
            </div>
            <button
              className="text-link danger"
              onClick={async () => {
                await api(`/admin/media/${m.id}`, { method: "DELETE" });
                reload();
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
