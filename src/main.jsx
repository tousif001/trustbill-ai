import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Download, FileText, MessageCircle, Plus, Printer, Search, Trash2 } from 'lucide-react';
import './style.css';

const STORAGE_KEY = 'trustbill_ai_records_v1';

const initialForm = {
  studentName: '',
  guardianName: '',
  mobile: '',
  course: '',
  amount: '',
  paid: '',
  dueDate: '',
  utr: '',
  method: 'UPI',
  month: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  status: 'Paid',
  note: '',
};

function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeReceiptNo() {
  return `TB-${Date.now().toString().slice(-7)}`;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function StatCard({ title, value, tone = '' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return records;
    return records.filter((record) =>
      [record.studentName, record.guardianName, record.mobile, record.course, record.utr, record.month, record.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [records, search]);

  const stats = useMemo(() => {
    const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = records.reduce((sum, item) => sum + Number(item.paid || 0), 0);
    const pending = Math.max(total - paid, 0);
    const dueCount = records.filter((item) => Number(item.amount || 0) > Number(item.paid || 0)).length;
    return { total, paid, pending, dueCount };
  }, [records]);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    if (field === 'amount' || field === 'paid') {
      const amount = Number(field === 'amount' ? value : next.amount || 0);
      const paid = Number(field === 'paid' ? value : next.paid || 0);
      next.status = paid >= amount && amount > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
    }
    setForm(next);
  };

  const addRecord = () => {
    if (!form.studentName.trim() || !form.mobile.trim() || !form.amount || !form.paid) {
      alert('Please enter student name, mobile, total fee, and paid amount.');
      return;
    }

    const record = {
      ...form,
      id: crypto.randomUUID(),
      receiptNo: makeReceiptNo(),
      date: today(),
      amount: Number(form.amount),
      paid: Number(form.paid),
      balance: Math.max(Number(form.amount) - Number(form.paid), 0),
    };

    setRecords((current) => [record, ...current]);
    setActiveReceipt(record);
    setForm(initialForm);
  };

  const deleteRecord = (id) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  const copyText = async (label, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1600);
  };

  const receiptText = (record) => {
    return `TRUSTBILL AI RECEIPT\nReceipt No: ${record.receiptNo}\nDate: ${record.date}\nStudent: ${record.studentName}\nGuardian: ${record.guardianName || '-'}\nMobile: ${record.mobile}\nCourse/Class: ${record.course || '-'}\nMonth: ${record.month}\nTotal Fee: ${currency(record.amount)}\nPaid: ${currency(record.paid)}\nBalance: ${currency(record.balance)}\nPayment Method: ${record.method}\nUTR/Txn ID: ${record.utr || '-'}\nStatus: ${record.status}\nNote: ${record.note || '-'}`;
  };

  const whatsappText = (record) => {
    if (record.balance > 0) {
      return `Hello ${record.guardianName || 'Parent'}, payment received for ${record.studentName}. Paid: ${currency(record.paid)}. Balance pending: ${currency(record.balance)}. Due date: ${record.dueDate || 'soon'}. Receipt No: ${record.receiptNo}. Thank you.`;
    }
    return `Hello ${record.guardianName || 'Parent'}, fee payment received for ${record.studentName}. Amount: ${currency(record.paid)} for ${record.month}. Receipt No: ${record.receiptNo}. Thank you.`;
  };

  const reminderText = (record) => {
    return `Hello ${record.guardianName || 'Parent'}, reminder for ${record.studentName}. Balance fee ${currency(record.balance)} is pending${record.dueDate ? `, due on ${record.dueDate}` : ''}. Please complete the payment. Thank you.`;
  };

  return (
    <main className="app-shell">
      <section className="atomic-frame">
        <nav className="top-nav">
          <div className="brand-mark">trustbill</div>
          <a href="#records">RECORDS</a>
          <div className="nav-meta">
            <span>© TRUSTBILL</span>
            <span>FEE LEDGER</span>
          </div>
        </nav>

        <section className="hero">
          <div className="showreel">
            <span className="play-dot">▶</span>
            <span>FEE<br />CONTROL</span>
          </div>

          <div className="hero-copy">
            <h1>Receipts and fee records that feel premium.</h1>
          </div>

          <div className="hero-numbers">
            <div><strong>{records.length}+</strong><span>RECEIPTS</span></div>
            <div><strong>{stats.dueCount}+</strong><span>PENDING</span></div>
          </div>
        </section>

        <section className="blue-stage">
          <div className="floating-receipt receipt-one">
            <small>COLLECTED</small>
            <strong>{currency(stats.paid)}</strong>
          </div>
          <div className="floating-receipt receipt-two">
            <small>PENDING</small>
            <strong>{currency(stats.pending)}</strong>
          </div>
        </section>
      </section>

      <section className="stats-grid">
        <StatCard title="Total Fees" value={currency(stats.total)} />
        <StatCard title="Collected" value={currency(stats.paid)} tone="good" />
        <StatCard title="Pending" value={currency(stats.pending)} tone="warning" />
        <StatCard title="Due Students" value={stats.dueCount} />
      </section>

      <section className="main-grid" id="records">
        <div className="panel">
          <h2><Plus size={24} /> Add Payment</h2>
          <div className="form-grid two">
            <Field label="Student Name" value={form.studentName} onChange={(value) => update('studentName', value)} placeholder="Ayan Khan" />
            <Field label="Guardian Name" value={form.guardianName} onChange={(value) => update('guardianName', value)} placeholder="Mr. Khan" />
            <Field label="Mobile Number" value={form.mobile} onChange={(value) => update('mobile', value)} placeholder="9876543210" />
            <Field label="Course / Class" value={form.course} onChange={(value) => update('course', value)} placeholder="Class 10 Maths" />
            <Field label="Total Fee" type="number" value={form.amount} onChange={(value) => update('amount', value)} placeholder="1500" />
            <Field label="Paid Amount" type="number" value={form.paid} onChange={(value) => update('paid', value)} placeholder="1500" />
            <Field label="UTR / Transaction ID" value={form.utr} onChange={(value) => update('utr', value)} placeholder="UPI reference number" />
            <Field label="Due Date" type="date" value={form.dueDate} onChange={(value) => update('dueDate', value)} />
          </div>

          <div className="form-grid two">
            <label>
              Payment Method
              <select value={form.method} onChange={(e) => update('method', e.target.value)}>
                <option>UPI</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Paid</option>
                <option>Partial</option>
                <option>Pending</option>
              </select>
            </label>
          </div>

          <Field label="Month / Fee Period" value={form.month} onChange={(value) => update('month', value)} />
          <label>
            Note
            <textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Any extra note..." />
          </label>
          <button className="primary-button" onClick={addRecord}>Create Receipt</button>
        </div>

        <div className="panel">
          <h2><Search size={24} /> Records</h2>
          <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, mobile, UTR, status..." />
          <div className="records-list">
            {filtered.length === 0 && <p className="muted">No records yet. Add your first payment.</p>}
            {filtered.map((record) => (
              <article className="record-card" key={record.id}>
                <div className="record-top">
                  <strong>{record.studentName}</strong>
                  <span className={record.balance > 0 ? 'badge warning-badge' : 'badge good-badge'}>{record.status}</span>
                </div>
                <p>{record.course || 'Course not added'} • {record.month}</p>
                <div className="money-row">
                  <span>Paid {currency(record.paid)}</span>
                  <span>Balance {currency(record.balance)}</span>
                </div>
                <div className="actions-row">
                  <button onClick={() => setActiveReceipt(record)}><FileText size={16} /> Receipt</button>
                  <button onClick={() => copyText('WhatsApp', whatsappText(record))}><MessageCircle size={16} /> WhatsApp</button>
                  {record.balance > 0 && <button onClick={() => copyText('Reminder', reminderText(record))}>Reminder</button>}
                  <button className="danger-button" onClick={() => deleteRecord(record.id)}><Trash2 size={16} /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeReceipt && (
        <section className="receipt-overlay">
          <div className="receipt-card" id="receipt">
            <button className="close-button" onClick={() => setActiveReceipt(null)}>×</button>
            <h2>TrustBill AI Receipt</h2>
            <p className="muted">Receipt No: {activeReceipt.receiptNo} • Date: {activeReceipt.date}</p>
            <div className="receipt-grid">
              <span>Student</span><strong>{activeReceipt.studentName}</strong>
              <span>Guardian</span><strong>{activeReceipt.guardianName || '-'}</strong>
              <span>Mobile</span><strong>{activeReceipt.mobile}</strong>
              <span>Course</span><strong>{activeReceipt.course || '-'}</strong>
              <span>Month</span><strong>{activeReceipt.month}</strong>
              <span>Total Fee</span><strong>{currency(activeReceipt.amount)}</strong>
              <span>Paid</span><strong>{currency(activeReceipt.paid)}</strong>
              <span>Balance</span><strong>{currency(activeReceipt.balance)}</strong>
              <span>Method</span><strong>{activeReceipt.method}</strong>
              <span>UTR</span><strong>{activeReceipt.utr || '-'}</strong>
              <span>Status</span><strong>{activeReceipt.status}</strong>
            </div>
            <p className="receipt-note">{activeReceipt.note || 'Thank you for your payment.'}</p>
            <div className="receipt-actions">
              <button className="primary-button" onClick={() => copyText('Receipt', receiptText(activeReceipt))}><Download size={16} /> Copy Receipt</button>
              <button onClick={() => copyText('WhatsApp', whatsappText(activeReceipt))}><MessageCircle size={16} /> Copy WhatsApp</button>
              <button onClick={() => window.print()}><Printer size={16} /> Print / Save PDF</button>
            </div>
          </div>
        </section>
      )}

      {copied && <div className="toast">{copied} copied</div>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
