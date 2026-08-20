import { useEffect, useState } from "react";

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

    const total =
      Number(hours || 0) * Number(mentor.hourly_rate || 0);

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

  const matchesStatus =
    statusFilter === "All" ||
    invoice.payment_status === statusFilter;

  const matchesBatch =
    batchFilter === "All" ||
    invoice.batch_name === batchFilter;

  const matchesMonth =
    monthFilter === "All" ||
    invoice.month === monthFilter;

    
  return (
    matchesSearch &&
    matchesStatus &&
    matchesBatch &&
    matchesMonth
  );
});

// Pagination
const indexOfLastInvoice = currentPage * invoicesPerPage;
const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;

const currentInvoices = filteredInvoices.slice(
  indexOfFirstInvoice,
  indexOfLastInvoice
);

const totalPages = Math.ceil(
  filteredInvoices.length / invoicesPerPage
);



  const [loading, setLoading] = useState(false);
 const [summary, setSummary] = useState({
  total_amount: 0,
  pending_amount: 0,
  total_hours: 0,
  total_sessions: 0,
  total_invoices: 0,
});

const [editId, setEditId] = useState(null);
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
  // ----------------------------
  // Fetch Data
  // ----------------------------

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
    const res = await fetch(
      `http://127.0.0.1:8000/invoice-paid/${id}`,
      {
        method: "PUT",
      }
    );

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

const confirmDelete = window.confirm(
    "Are you sure you want to delete this invoice?"
  );

  if (!confirmDelete) return;

  try {

    const res = await fetch(
      `http://127.0.0.1:8000/invoices/${id}`,
      {
        method: "DELETE",
      }
    );

    if(res.ok){
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
    const res = await fetch(
      `http://127.0.0.1:8000/send-invoice/${id}`,
      {
        method: "POST",
      }
    );

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
  // ----------------------------
  // Hours Change
  // ----------------------------

  const handleHoursChange = (e) => {
    const value = e.target.value;

    setHours(value);

    const total =
      Number(value || 0) * Number(rate || 0);

    setAmount(total);
  };

  // ----------------------------
  // Save Invoice
  // ----------------------------

  const saveInvoice = async () => {
  if (
    !mentorName ||
    !batchName ||
    !month ||
    !sessions ||
    !hours
  ) {
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

  // Change this as needed
  payment_status: "Paid",
};

  const url = editId
    ? `http://127.0.0.1:8000/invoice/${editId}`
    : "http://127.0.0.1:8000/invoices";

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

    alert(
      editId
        ? "Invoice Updated Successfully"
        : "Invoice Created Successfully"
    );

    // Refresh table and summary
    await fetchInvoices();
    await fetchSummary();

    // Reset form
    setMentorName("");
    setMentorEmail("");
    setBatchName("");
    setMonth("");
    setSessions("");
    setHours("");
    setRate("");
    setAmount("");

    // Exit edit mode
    setEditId(null);

  } catch (err) {
    console.error(err);
    alert("Server Error");
  } finally {
    setLoading(false);
  }
};
  // ----------------------------
  // UI
  // ----------------------------

  return (
    <div style={containerStyle}>
      <h1>💰 Invoice Generator</h1>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginTop: "25px",
    marginBottom: "35px",
  }}
>
  <div style={cardStyle}>
    <h3>💰 Total Amount</h3>
    <h2>₹{summary.total_amount}</h2>
  </div>

  <div style={cardStyle}>
    <h3>⏳ Pending Amount</h3>
    <h2>₹{summary.pending_amount}</h2>
  </div>

  <div style={cardStyle}>
    <h3>📄 Total Invoices</h3>
    <h2>{summary.total_invoices}</h2>
  </div>

  <div style={cardStyle}>
    <h3>⏱ Total Hours</h3>
    <h2>{summary.total_hours}</h2>
  </div>
</div>
       
      <div style={gridStyle}>

        <div>
          <label>Mentor</label>

          <select
            value={mentorName}
            onChange={handleMentorChange}
            style={inputStyle}
          >
            <option value="">Select Mentor</option>

            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.name}>
                {mentor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Batch</label>

          <select
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select Batch</option>

            {batches.map((batch) => (
              <option key={batch.id} value={batch.batch_name}>
                {batch.batch_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Month</label>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>Total Sessions</label>

          <input
            type="number"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>Total Hours</label>

          <input
            type="number"
            value={hours}
            onChange={handleHoursChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label>Hourly Rate</label>

          <input
            value={rate}
            readOnly
            style={{
              ...inputStyle,
              background: "#f3f4f6",
            }}
          />
        </div>

        <div>
          <label>Total Amount</label>

          <input
            value={amount}
            readOnly
            style={{
              ...inputStyle,
              background: "#f3f4f6",
            }}
          />
        </div>
      </div>

      <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  }}
>
  <button
    onClick={saveInvoice}
    style={buttonStyle}
    disabled={loading}
  >
    {loading
      ? "Saving..."
      : editId
      ? "Update Invoice"
      : "Generate Invoice"}
  </button>

  {editId && (
    <button
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
      style={{
        background: "#6b7280",
        color: "#fff",
        border: "none",
        padding: "12px 20px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Cancel
    </button>
  )}
</div>

     <hr style={{ margin: "30px 0" }} />

<div
  style={{
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <input
    type="text"
    placeholder="🔍 Search by Mentor, Batch or Month..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "350px",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #444",
    }}
  />
<select
  value={batchFilter}
  onChange={(e) => setBatchFilter(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #444",
    width: "180px",
  }}
>
  <option value="All">All Batches</option>

  {[...new Set(invoices.map((invoice) => invoice.batch_name))].map(
    (batch) => (
      <option key={batch} value={batch}>
        {batch}
      </option>
    )
  )}
</select>

{/* Month Filter */}
<select
  value={monthFilter}
  onChange={(e) => setMonthFilter(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #444",
    width: "180px",
  }}
>
  <option value="All">All Months</option>

  {[...new Set(invoices.map((invoice) => invoice.month))].map(
    (month) => (
      <option key={month} value={month}>
        {month}
      </option>
    )
  )}
</select>

<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #444",
    width: "180px",
  }}
>
  <option value="All">All Status</option>
  <option value="Paid">Paid</option>
  <option value="Pending">Pending</option>
</select>

</div>

<hr style={{ margin: "25px 0" }} />

<h2>Invoice History</h2>

<table style={tableStyle}>
  <thead>
  <tr>
    <th style={thStyle}>Mentor</th>
    <th style={thStyle}>Invoice No.</th>
    <th style={thStyle}>Batch</th>
    <th style={thStyle}>Month</th>
    <th style={thStyle}>Sessions</th>
    <th style={thStyle}>Hours</th>
    <th style={thStyle}>Amount</th>
    <th style={thStyle}>Status</th>
    <th style={thStyle}>Payment</th>
   

    <th
      style={{
        ...thStyle,
        width: "170px",
      }}
    >
      Actions
    </th>
  </tr>
</thead>
         
        <tbody>
  {currentInvoices.map((invoice) => (
    <tr key={invoice.id}>
      <td style={tdStyle}>{invoice.mentor_name}</td>
      <td style={tdStyle}>
      {invoice.invoice_number || "-"}
</td>

      <td style={tdStyle}>{invoice.batch_name}</td>

      <td style={tdStyle}>{invoice.month}</td>

      <td style={tdStyle}>{invoice.total_sessions}</td>

      <td style={tdStyle}>{invoice.total_hours}</td>

      <td style={tdStyle}>
        ₹ {Number(invoice.total_amount).toLocaleString("en-IN")}
      </td>

      <td style={tdStyle}>
        {invoice.payment_status}
      </td>

      <td style={tdStyle}>
        {invoice.payment_status === "Pending" ? (
          <button
            onClick={() => markAsPaid(invoice.id)}
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Mark Paid
          </button>
        ) : (
          <span
            style={{
              color: "#16a34a",
              fontWeight: "bold",
            }}
          >
            ✔ Paid
          </span>
        )}
      </td>

      <td style={tdStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Download PDF */}
          <a
            href={`http://127.0.0.1:8000/download-invoice/${invoice.id}`}
            target="_blank"
            rel="noreferrer"
            title="Download PDF"
            style={{
              textDecoration: "none",
              fontSize: "20px",
            }}
          >
            📥
          </a>

          {/* Edit */}
          <span
            onClick={() => editInvoice(invoice)}
            title="Edit Invoice"
            style={{
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            ✏️
          </span>

          {/* Delete */}
          <span
            onClick={() => deleteInvoice(invoice.id)}
            title="Delete Invoice"
            style={{
              cursor: "pointer",
              fontSize: "20px",
              color: "#dc2626",
            }}
          >
            🗑️
          </span>
          {/* Send Email */}
<span
  onClick={() => sendInvoiceEmail(invoice.id)}
  title="Send Invoice Email"
  style={{
    cursor: "pointer",
    fontSize: "20px",
    color: "#2563eb",
  }}
>
  📧
</span>
        </div>
      </td>
    </tr>
  ))}
        </tbody>
      </table>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
  }}
>
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    style={{
      padding: "10px 18px",
      border: "none",
      background: currentPage === 1 ? "#d1d5db" : "#2563eb",
      color: "#fff",
      borderRadius: "6px",
      cursor: currentPage === 1 ? "not-allowed" : "pointer",
    }}
  >
    ⬅ Previous
  </button>

  <span
    style={{
      fontWeight: "bold",
      fontSize: "16px",
    }}
  >
    Page {currentPage} of {totalPages}
  </span>

  <button
    onClick={() =>
      setCurrentPage((p) => Math.min(p + 1, totalPages))
    }
    disabled={currentPage === totalPages}
    style={{
      padding: "10px 18px",
      border: "none",
      background:
        currentPage === totalPages ? "#d1d5db" : "#2563eb",
      color: "#fff",
      borderRadius: "6px",
      cursor:
        currentPage === totalPages
          ? "not-allowed"
          : "pointer",
    }}
  >
    Next ➡
  </button>
</div>
    </div>
  );
}
// ----------------------------
// Styles
// ----------------------------

const containerStyle = {
  maxWidth: "900px",
  margin: "40px auto",
  padding: "30px",
  background: "#fff",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,.15)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const buttonStyle = {
  marginTop: "25px",
  padding: "12px 20px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #444",
};
const cardStyle = {
  background: "#1f2937",
  color: "#fff",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};
const thStyle = {
  padding: "12px",
  border: "1px solid #444",
  background: "#1f2937",
  color: "#ffffff",
  textAlign: "center",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #444",
  textAlign: "center",
  verticalAlign: "middle",
};