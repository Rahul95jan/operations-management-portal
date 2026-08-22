import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ProtectedRoute from "../components/ProtectedRoute";

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  background: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.03em",
  color: "#64748b",
  marginBottom: "6px",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function KPITile({ title, value, color }) {
  return (
    <div className="kpi-tile" style={{ borderLeft: `4px solid ${color}` }}>
      <h4 style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: "#94a3b8" }}>
        {title}
      </h4>
      <h1 style={{ color, margin: 0, fontSize: "26px", fontVariantNumeric: "tabular-nums" }}>{value}</h1>
    </div>
  );
}

function PaymentBadge({ status }) {
  const paid = status === "Paid";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: paid ? "#dcfce7" : "#fef3c7",
        color: paid ? "#15803d" : "#b45309",
        fontSize: "12px",
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: "999px",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: paid ? "#22c55e" : "#f59e0b" }} />
      {status}
    </span>
  );
}

function InvoicePreviewModal({ invoice, mode, confirming, onClose, onConfirm, onSendEmail }) {
  const isView = mode === "view";
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const amountNum = Number(invoice.total_amount) || 0;

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-card" onClick={(e) => e.stopPropagation()}>
        <button className="preview-close" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="preview-header">
          <div className="preview-brand">KRISH NAIK ACADEMY</div>
          <div className="preview-doc-title">INVOICE</div>
          {invoice.invoice_number ? (
            <div className="preview-doc-number">{invoice.invoice_number}</div>
          ) : (
            <div className="preview-doc-number preview-doc-number-draft">DRAFT — NOT YET GENERATED</div>
          )}
        </div>

        <div className="preview-body">
          {!isView && (
            <div className="preview-banner">
              👁 This is a preview. Nothing has been saved yet — confirm below to generate the invoice.
            </div>
          )}

          <div className="preview-meta-grid">
            <div>
              <div className="preview-meta-label">Bill To</div>
              <div className="preview-meta-value">{invoice.mentor_name || "—"}</div>
              {invoice.mentor_email && <div className="preview-meta-sub">{invoice.mentor_email}</div>}
            </div>
            <div>
              <div className="preview-meta-label">Batch</div>
              <div className="preview-meta-value">{invoice.batch_name || "—"}</div>
            </div>
            <div>
              <div className="preview-meta-label">Month</div>
              <div className="preview-meta-value">{invoice.month || "—"}</div>
            </div>
            <div>
              <div className="preview-meta-label">Date</div>
              <div className="preview-meta-value">{today}</div>
            </div>
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Sessions</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Mentoring — {invoice.batch_name || "—"} ({invoice.month || "—"})
                </td>
                <td>{invoice.total_sessions}</td>
                <td>{invoice.total_hours}</td>
                <td>₹{invoice.hourly_rate}</td>
                <td>₹ {amountNum.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div className="preview-total-row">
            <span>Total Amount</span>
            <span className="preview-total-value">₹ {amountNum.toLocaleString("en-IN")}</span>
          </div>

          <div className="preview-status-row">
            <PaymentBadge status={invoice.payment_status || "Pending"} />
          </div>
        </div>

        <div className="preview-footer">
          {isView ? (
            <>
              {invoice.id && (
                <a
                  href={`http://127.0.0.1:8000/download-invoice/${invoice.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  📥 Download PDF
                </a>
              )}
              {invoice.id && (
                <button className="btn btn-primary" onClick={() => onSendEmail(invoice.id)}>
                  📧 Send Email
                </button>
              )}
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                ✏️ Keep Editing
              </button>
              <button className="btn btn-primary" onClick={onConfirm} disabled={confirming}>
                {confirming ? "Generating..." : "✅ Confirm & Generate Invoice"}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: overlayIn 0.15s ease;
        }

        .preview-card {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.4);
          animation: cardIn 0.2s ease;
        }

        .preview-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          z-index: 2;
        }

        .preview-close:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .preview-header {
          background: linear-gradient(120deg, #0f172a, #1e293b);
          padding: 26px 28px;
          border-radius: 16px 16px 0 0;
          text-align: center;
        }

        .preview-brand {
          color: #f8fafc;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.04em;
        }

        .preview-doc-title {
          color: #fbbf24;
          font-weight: 800;
          font-size: 26px;
          margin-top: 6px;
          letter-spacing: 0.06em;
        }

        .preview-doc-number {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 6px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .preview-doc-number-draft {
          color: #f59e0b;
        }

        .preview-body {
          padding: 24px 28px;
        }

        .preview-banner {
          background: #fffbeb;
          color: #92400e;
          font-size: 12.5px;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .preview-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .preview-meta-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .preview-meta-value {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }

        .preview-meta-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .preview-table th {
          text-align: left;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
          font-weight: 700;
          padding: 8px 6px;
          border-bottom: 2px solid #f1f5f9;
        }

        .preview-table td {
          padding: 10px 6px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }

        .preview-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fffbeb;
          padding: 12px 16px;
          border-radius: 10px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 16px;
        }

        .preview-total-value {
          font-size: 18px;
          color: #b45309;
        }

        .preview-status-row {
          display: flex;
          justify-content: flex-end;
        }

        .preview-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 28px;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }

        :global(.preview-footer .btn) {
          border: none;
          border-radius: 10px;
          padding: 11px 18px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.15s ease;
        }

        :global(.preview-footer .btn:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.preview-footer .btn-primary) {
          background: linear-gradient(120deg, #f59e0b, #fbbf24);
          color: #0f172a;
        }

        :global(.preview-footer .btn-primary:hover:not(:disabled)) {
          transform: translateY(-1px);
        }

        :global(.preview-footer .btn-ghost) {
          background: #f1f5f9;
          color: #475569;
        }

        :global(.preview-footer .btn-ghost:hover) {
          background: #e2e8f0;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoiceGenerator() {
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");

  const [batchName, setBatchName] = useState("");
  const [month, setMonth] = useState("");
  const [sessions, setSessions] = useState("");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 5;

  const handleMentorChange = (e) => {
    const selected = e.target.value;

    setMentorName(selected);

    const mentor = mentors.find((m) => m.name === selected);

    if (mentor) {
      setMentorEmail(mentor.email);

      setRate(mentor.hourly_rate);

      const total = Number(hours || 0) * Number(mentor.hourly_rate || 0);

      setAmount(total);
    }
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [batchFilter, setBatchFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.mentor_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.batch_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.month.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || invoice.payment_status === statusFilter;

    const matchesBatch = batchFilter === "All" || invoice.batch_name === batchFilter;

    const matchesMonth = monthFilter === "All" || invoice.month === monthFilter;

    return matchesSearch && matchesStatus && matchesBatch && matchesMonth;
  });

  // Pagination
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;

  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_amount: 0,
    pending_amount: 0,
    total_hours: 0,
    total_sessions: 0,
    total_invoices: 0,
  });

  const [editId, setEditId] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState("confirm"); // "confirm" | "view"
  const [previewData, setPreviewData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchMentors();
    fetchInvoices();
    fetchBatches();
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/invoice-summary");
      const data = await res.json();

      setSummary(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMentors = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors");
      const data = await res.json();
      setMentors(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batch-names");
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.log(err);
    }
  };

  const editInvoice = (invoice) => {
    setEditId(invoice.id);

    setMentorName(invoice.mentor_name);
    setMentorEmail(invoice.mentor_email || "");

    setBatchName(invoice.batch_name);
    setMonth(invoice.month);

    setSessions(invoice.total_sessions);
    setHours(invoice.total_hours);
    setRate(invoice.hourly_rate);
    setAmount(invoice.total_amount);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const markAsPaid = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/invoice-paid/${id}`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("Invoice marked as Paid");
        fetchInvoices();
        fetchSummary();
      } else {
        alert("Failed to update invoice");
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  const deleteInvoice = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this invoice?");

    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/invoices/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Invoice Deleted Successfully");
        fetchInvoices();
        fetchSummary();
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  const sendInvoiceEmail = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/send-invoice/${id}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        alert("Invoice sent successfully.");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send email.");
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleHoursChange = (e) => {
    const value = e.target.value;

    setHours(value);

    const total = Number(value || 0) * Number(rate || 0);

    setAmount(total);
  };

  const saveInvoice = async () => {
    if (!mentorName || !batchName || !month || !sessions || !hours) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      mentor_name: mentorName,
      mentor_email: mentorEmail,

      batch_name: batchName,
      month,

      total_sessions: Number(sessions),
      total_hours: String(hours),

      hourly_rate: String(rate),
      total_amount: String(amount),

      payment_status: "Paid",
    };

    const url = editId ? `http://127.0.0.1:8000/invoice/${editId}` : "http://127.0.0.1:8000/invoices";

    const method = editId ? "PUT" : "POST";

    try {
      setLoading(true);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed");
        return;
      }

      alert(editId ? "Invoice Updated Successfully" : "Invoice Created Successfully");

      await fetchInvoices();
      await fetchSummary();

      setMentorName("");
      setMentorEmail("");
      setBatchName("");
      setMonth("");
      setSessions("");
      setHours("");
      setRate("");
      setAmount("");

      setEditId(null);
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  const openFormPreview = () => {
    if (!mentorName || !batchName || !month || !sessions || !hours) {
      alert("Please fill all fields");
      return;
    }

    setPreviewData({
      mentor_name: mentorName,
      mentor_email: mentorEmail,
      batch_name: batchName,
      month,
      total_sessions: sessions,
      total_hours: hours,
      hourly_rate: rate,
      total_amount: amount,
      payment_status: "Paid",
      invoice_number: null,
      id: editId,
    });
    setPreviewMode("confirm");
    setPreviewOpen(true);
  };

  const openHistoryPreview = (invoice) => {
    setPreviewData(invoice);
    setPreviewMode("view");
    setPreviewOpen(true);
  };

  const closePreview = () => setPreviewOpen(false);

  const confirmAndGenerate = async () => {
    setConfirming(true);
    try {
      await saveInvoice();
    } finally {
      setConfirming(false);
      setPreviewOpen(false);
    }
  };

  return (
    <ProtectedRoute>
      <>
        <Sidebar />

        <div
          style={{
            marginLeft: "280px",
            padding: "32px 36px 60px",
            background: "#f1f5f9",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <div className="page-hero">
            <div className="page-hero-blob" />
            <div className="page-hero-content">
              <div className="page-hero-eyebrow">Operations</div>
              <h1 className="page-hero-title">Invoice Generator</h1>
              <p className="page-hero-subtitle">
                Generate mentor invoices, track payment status, and send them out.
              </p>
            </div>
            <div className="page-hero-stat">
              <div className="page-hero-stat-value">₹{summary.total_amount}</div>
              <div className="page-hero-stat-label">Total Billed</div>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="kpi-grid">
            <KPITile title="Total Amount" value={`₹${summary.total_amount}`} color="#16a34a" />
            <KPITile title="Pending Amount" value={`₹${summary.pending_amount}`} color="#dc2626" />
            <KPITile title="Total Invoices" value={summary.total_invoices} color="#2563eb" />
            <KPITile title="Total Hours" value={summary.total_hours} color="#7c3aed" />
          </div>

          {/* Form */}
          <div className="card form-card">
            <h2 className="card-title">{editId ? "✏️ Update Invoice" : "➕ Generate Invoice"}</h2>

            <div className="form-grid">
              <Field label="Mentor">
                <select className="styled-input" style={inputStyle} value={mentorName} onChange={handleMentorChange}>
                  <option value="">Select Mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.name}>
                      {mentor.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Batch">
                <select className="styled-input" style={inputStyle} value={batchName} onChange={(e) => setBatchName(e.target.value)}>
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.batch_name}>
                      {batch.batch_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Month">
                <input type="month" className="styled-input" style={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} />
              </Field>

              <Field label="Total Sessions">
                <input type="number" className="styled-input" style={inputStyle} value={sessions} onChange={(e) => setSessions(e.target.value)} />
              </Field>

              <Field label="Total Hours">
                <input type="number" className="styled-input" style={inputStyle} value={hours} onChange={handleHoursChange} />
              </Field>

              <Field label="Hourly Rate">
                <input className="styled-input" readOnly value={rate} style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b" }} />
              </Field>

              <Field label="Total Amount">
                <input className="styled-input" readOnly value={amount} style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b", fontWeight: 700 }} />
              </Field>
            </div>

            <div style={{ marginTop: "22px", display: "flex", gap: "12px" }}>
              <button className="btn btn-primary" onClick={openFormPreview} disabled={loading}>
                {loading ? "Saving..." : editId ? "👁 Preview & Update" : "👁 Preview & Generate"}
              </button>

              {editId && (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditId(null);
                    setMentorName("");
                    setMentorEmail("");
                    setBatchName("");
                    setMonth("");
                    setSessions("");
                    setHours("");
                    setRate("");
                    setAmount("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Invoice history */}
          <div className="card" style={{ marginTop: "24px" }}>
            <div className="list-toolbar">
              <h2 className="card-title" style={{ margin: 0 }}>
                📄 Invoice History
              </h2>

              <div className="filter-row">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search mentor, batch, month..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="styled-input search-input"
                  />
                </div>

                <select className="styled-input filter-select" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                  <option value="All">All Batches</option>
                  {[...new Set(invoices.map((invoice) => invoice.batch_name))].map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>

                <select className="styled-input filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                  <option value="All">All Months</option>
                  {[...new Set(invoices.map((invoice) => invoice.month))].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select className="styled-input filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>Invoice No.</th>
                    <th>Batch</th>
                    <th>Month</th>
                    <th>Sessions</th>
                    <th>Hours</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentInvoices.map((invoice, i) => (
                    <tr key={invoice.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="strong">{invoice.mentor_name}</td>
                      <td className="muted">{invoice.invoice_number || "-"}</td>
                      <td>{invoice.batch_name}</td>
                      <td>{invoice.month}</td>
                      <td>{invoice.total_sessions}</td>
                      <td>{invoice.total_hours}</td>
                      <td className="strong">₹ {Number(invoice.total_amount).toLocaleString("en-IN")}</td>
                      <td>
                        <PaymentBadge status={invoice.payment_status} />
                      </td>
                      <td>
                        {invoice.payment_status === "Pending" ? (
                          <button className="btn btn-mark-paid" onClick={() => markAsPaid(invoice.id)}>
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13px" }}>✔ Paid</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                          <a
                            href={`http://127.0.0.1:8000/download-invoice/${invoice.id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF"
                            className="action-icon"
                          >
                            📥
                          </a>
                          <span onClick={() => editInvoice(invoice)} title="Edit Invoice" className="action-icon">
                            ✏️
                          </span>
                          <span onClick={() => deleteInvoice(invoice.id)} title="Delete Invoice" className="action-icon action-danger">
                            🗑️
                          </span>
                          <span onClick={() => openHistoryPreview(invoice)} title="Preview Invoice" className="action-icon">
                            👁️
                          </span>
                          <span onClick={() => sendInvoiceEmail(invoice.id)} title="Send Invoice Email" className="action-icon action-primary">
                            📧
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentInvoices.length === 0 && (
                <div className="empty-state">
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
                  {invoices.length === 0 ? "No invoices yet — generate your first one above." : "No invoices match your filters."}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ⬅ Previous
                </button>

                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next ➡
                </button>
              </div>
            )}
          </div>
        </div>

        {previewOpen && previewData && (
          <InvoicePreviewModal
            invoice={previewData}
            mode={previewMode}
            confirming={confirming}
            onClose={closePreview}
            onConfirm={confirmAndGenerate}
            onSendEmail={sendInvoiceEmail}
          />
        )}

        <style jsx>{`
          .page-hero {
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            padding: 30px 32px;
            margin-bottom: 24px;
            background: linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
            background-size: 200% 200%;
            animation: heroShift 12s ease infinite;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.55);
          }

          .page-hero-blob {
            position: absolute;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            background: #f59e0b;
            filter: blur(60px);
            opacity: 0.3;
            top: -80px;
            right: 160px;
            animation: float 9s ease-in-out infinite;
          }

          .page-hero-content {
            position: relative;
            z-index: 1;
          }

          .page-hero-eyebrow {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            border: 1px solid rgba(251, 191, 36, 0.3);
            padding: 5px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
          }

          .page-hero-title {
            font-size: 26px;
            font-weight: 800;
            color: #f8fafc;
            margin: 0 0 6px;
          }

          .page-hero-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
          }

          .page-hero-stat {
            position: relative;
            z-index: 1;
            text-align: center;
            padding: 14px 26px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }

          .page-hero-stat-value {
            font-size: 26px;
            font-weight: 800;
            color: #fbbf24;
          }

          .page-hero-stat-label {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }

          :global(.kpi-tile) {
            background: #fff;
            padding: 18px 20px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          :global(.kpi-tile:hover) {
            transform: translateY(-2px);
            box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.25);
          }

          .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 26px 28px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            border: 1px solid #eef2f7;
          }

          .card-title {
            margin: 0 0 18px;
            font-size: 17px;
            color: #1e293b;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 18px;
          }

          .styled-input:focus {
            border-color: #f59e0b !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }

          .btn {
            border: none;
            border-radius: 10px;
            padding: 11px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-primary {
            background: linear-gradient(120deg, #f59e0b, #fbbf24);
            color: #0f172a;
            box-shadow: 0 6px 16px -6px rgba(245, 158, 11, 0.6);
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -6px rgba(245, 158, 11, 0.7);
          }

          .btn-ghost {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-ghost:hover:not(:disabled) {
            background: #e2e8f0;
          }

          .btn-mark-paid {
            background: #16a34a;
            color: white;
            padding: 6px 12px;
            font-size: 12px;
          }

          .btn-mark-paid:hover {
            background: #15803d;
          }

          .list-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 14px;
            margin-bottom: 18px;
          }

          .filter-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .filter-select {
            width: 160px;
          }

          .search-wrap {
            position: relative;
          }

          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 13px;
            opacity: 0.5;
          }

          .search-input {
            width: 240px;
            padding-left: 34px !important;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .styled-table thead th {
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #94a3b8;
            font-weight: 700;
            padding: 10px 14px;
            border-bottom: 2px solid #f1f5f9;
            white-space: nowrap;
          }

          .styled-table tbody tr {
            animation: fadeSlideUp 0.3s ease both;
            transition: background 0.12s ease;
          }

          .styled-table tbody tr:hover {
            background: #fafaf9;
          }

          .styled-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
            text-align: center;
          }

          .styled-table td.muted {
            color: #94a3b8;
          }

          .styled-table td.strong {
            font-weight: 600;
          }

          .action-icon {
            cursor: pointer;
            font-size: 18px;
            text-decoration: none;
            transition: transform 0.12s ease;
          }

          .action-icon:hover {
            transform: scale(1.15);
          }

          .action-danger:hover {
            filter: hue-rotate(0deg);
          }

          .empty-state {
            text-align: center;
            padding: 50px 20px;
            color: #94a3b8;
            font-size: 14px;
          }

          .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }

          .page-indicator {
            font-weight: 700;
            font-size: 14px;
            color: #475569;
          }

          @keyframes heroShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(16px);
            }
          }

          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
