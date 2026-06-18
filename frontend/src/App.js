import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API });

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: #1a1a2e; color: #fff; padding: 24px 0; flex-shrink: 0; }
  .sidebar h2 { font-size: 1rem; padding: 0 20px 20px; border-bottom: 1px solid #2d2d44; color: #7c83fd; letter-spacing: 1px; text-transform: uppercase; }
  .nav-item { padding: 12px 20px; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; gap: 10px; transition: background 0.2s; }
  .nav-item:hover { background: #2d2d44; }
  .nav-item.active { background: #7c83fd; color: #fff; }
  .main { flex: 1; padding: 32px; overflow-y: auto; }
  .page-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 24px; color: #1a1a2e; }
  .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); margin-bottom: 24px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); text-align: center; }
  .stat-card .num { font-size: 2.2rem; font-weight: 700; color: #7c83fd; }
  .stat-card .label { font-size: 0.85rem; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f7f8ff; text-align: left; padding: 12px 16px; font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
  td { padding: 12px 16px; border-bottom: 1px solid #f0f2f5; font-size: 0.9rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f7f8ff; }
  .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: opacity 0.2s; }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: #7c83fd; color: #fff; }
  .btn-danger { background: #ff4d6d; color: #fff; }
  .btn-sm { padding: 5px 12px; font-size: 0.78rem; }
  .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group label { font-size: 0.82rem; font-weight: 600; color: #555; }
  .form-group input, .form-group select { padding: 9px 12px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border 0.2s; }
  .form-group input:focus, .form-group select:focus { border-color: #7c83fd; }
  .alert { padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.88rem; }
  .alert-success { background: #e8faf0; color: #2d7a4f; border: 1px solid #b2dfca; }
  .alert-error { background: #fff0f3; color: #c62a47; border: 1px solid #ffc1cc; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-low { background: #fff0f3; color: #c62a47; }
  .badge-ok { background: #e8faf0; color: #2d7a4f; }
  .order-items-form { border: 1.5px solid #e0e0e0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .order-item-row { display: grid; grid-template-columns: 1fr 100px 36px; gap: 10px; align-items: end; margin-bottom: 10px; }
  @media (max-width: 700px) {
    .layout { flex-direction: column; }
    .sidebar { width: 100%; padding: 12px 0; }
    .main { padding: 16px; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function Alert({ msg, type }) {
  if (!msg) return null;
  return <div className={`alert alert-${type}`}>{msg}</div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);
  if (!data) return <p>Loading…</p>;
  return (
    <div>
      <div className="stats-grid">
        {[['Total Products', data.total_products], ['Total Customers', data.total_customers], ['Total Orders', data.total_orders], ['Low Stock Items', data.low_stock.length]].map(([label, num]) => (
          <div className="stat-card" key={label}><div className="num">{num}</div><div className="label">{label}</div></div>
        ))}
      </div>
      {data.low_stock.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 14, color: '#c62a47' }}>⚠ Low Stock Alerts</h3>
          <table>
            <thead><tr><th>Product</th><th>Qty Remaining</th></tr></thead>
            <tbody>{data.low_stock.map(p => (
              <tr key={p.id}><td>{p.name}</td><td><span className="badge badge-low">{p.quantity} left</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────────
function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', sku: '', price: '', quantity: '' });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = useCallback(() => api.get('/products').then(r => setProducts(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const save = async () => {
    try {
      const payload = { ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) };
      if (editing) { await api.put(`/products/${editing}`, payload); flash('Product updated!'); }
      else { await api.post('/products', payload); flash('Product added!'); }
      setForm({ name: '', sku: '', price: '', quantity: '' }); setEditing(null); load();
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`); flash('Deleted'); load();
  };

  const startEdit = (p) => { setEditing(p.id); setForm({ name: p.name, sku: p.sku, price: p.price, quantity: p.quantity }); };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit Product' : 'Add Product'}</h3>
        <div className="form-row">
          {[['name', 'Product Name', 'text'], ['sku', 'SKU / Code', 'text'], ['price', 'Price (₹)', 'number'], ['quantity', 'Quantity', 'number']].map(([key, label, type]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={label} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={save}>{editing ? 'Update' : 'Add Product'}</button>
          {editing && <button className="btn" style={{ background: '#eee' }} onClick={() => { setEditing(null); setForm({ name: '', sku: '', price: '', quantity: '' }); }}>Cancel</button>}
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>{products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.sku}</td><td>₹{p.price.toFixed(2)}</td>
              <td><span className={`badge ${p.quantity < 5 ? 'badge-low' : 'badge-ok'}`}>{p.quantity}</span></td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => startEdit(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────────────────────────
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = useCallback(() => api.get('/customers').then(r => setCustomers(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const save = async () => {
    try {
      await api.post('/customers', form);
      setForm({ name: '', email: '', phone: '' }); flash('Customer added!'); load();
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`); flash('Deleted'); load();
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Add Customer</h3>
        <div className="form-row">
          {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel']].map(([key, label, type]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={label} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={save}>Add Customer</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead>
          <tbody>{customers.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td>
              <td><button className="btn btn-danger btn-sm" onClick={() => del(c.id)}>Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    api.get('/orders').then(r => setOrders(r.data));
    api.get('/customers').then(r => setCustomers(r.data));
    api.get('/products').then(r => setProducts(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => { const copy = [...items]; copy[i][key] = val; setItems(copy); };

  const save = async () => {
    try {
      const payload = { customer_id: parseInt(customerId), items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })) };
      await api.post('/orders', payload);
      setCustomerId(''); setItems([{ product_id: '', quantity: 1 }]);
      flash('Order created!'); load();
    } catch (e) { flash(e.response?.data?.detail || 'Error', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    await api.delete(`/orders/${id}`); flash('Order cancelled'); load();
  };

  return (
    <div>
      <Alert msg={msg.text} type={msg.type} />
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Create Order</h3>
        <div className="form-group" style={{ marginBottom: 16, maxWidth: 300 }}>
          <label>Customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="order-items-form">
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.85rem', color: '#555' }}>Order Items</div>
          {items.map((item, i) => (
            <div className="order-item-row" key={i}>
              <div className="form-group" style={{ margin: 0 }}>
                <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
            </div>
          ))}
          <button className="btn btn-sm" style={{ background: '#eee', marginTop: 4 }} onClick={addItem}>+ Add Item</button>
        </div>
        <button className="btn btn-primary" onClick={save}>Place Order</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{customers.find(c => c.id === o.customer_id)?.name || o.customer_id}</td>
              <td>₹{o.total.toFixed(2)}</td>
              <td>{new Date(o.created_at).toLocaleDateString()}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setDetail(detail?.id === o.id ? null : o)}>Details</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(o.id)}>Cancel</button>
              </td>
            </tr>
          ))}
          {detail && (
            <tr><td colSpan={5} style={{ background: '#f7f8ff', padding: 16 }}>
              <strong>Order #{detail.id} Items:</strong>
              <table style={{ marginTop: 8, width: 'auto' }}>
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>{detail.items.map((item, i) => (
                  <tr key={i}>
                    <td>{products.find(p => p.id === item.product_id)?.name || item.product_id}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unit_price}</td>
                    <td>₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </td></tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'products',  label: '📦 Products' },
  { key: 'customers', label: '👥 Customers' },
  { key: 'orders',    label: '🛒 Orders' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const pages = { dashboard: Dashboard, products: Products, customers: Customers, orders: Orders };
  const Page = pages[page];

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        <nav className="sidebar">
          <h2>InvTrack</h2>
          {NAV.map(n => (
            <div key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => setPage(n.key)}>{n.label}</div>
          ))}
        </nav>
        <main className="main">
          <div className="page-title">{NAV.find(n => n.key === page)?.label}</div>
          <Page />
        </main>
      </div>
    </>
  );
}
