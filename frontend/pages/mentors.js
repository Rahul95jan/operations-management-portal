import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    expertise: "",
    linkedin: "",
    hourly_rate: "",
  });

  const loadMentors = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors");
      const data = await res.json();
      setMentors(data);
    } catch (error) {
      console.error("Error loading mentors:", error);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const clearForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      expertise: "",
      linkedin: "",
      hourly_rate: "",
    });

    setEditId(null);
  };

  const createMentor = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Failed to create mentor");
        return;
      }

      await loadMentors();
      clearForm();
    } catch (error) {
      console.error("Error creating mentor:", error);
    }
  };

  const updateMentor = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/mentors/${editId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Failed to update mentor");
        return;
      }

      await loadMentors();
      clearForm();
    } catch (error) {
      console.error("Error updating mentor:", error);
    }
  };

  const deleteMentor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mentor?")) {
      return;
    }

    try {
      await fetch(`http://127.0.0.1:8000/mentors/${id}`, {
        method: "DELETE",
      });

      loadMentors();
    } catch (error) {
      console.error("Error deleting mentor:", error);
    }
  };

  const editMentor = (mentor) => {
    setEditId(mentor.id);

    setForm({
      name: mentor.name || "",
      email: mentor.email || "",
      phone: mentor.phone || "",
      expertise: mentor.expertise || "",
      linkedin: mentor.linkedin || "",
      hourly_rate: mentor.hourly_rate || "",
    });
  };

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.name?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.email?.toLowerCase().includes(search.toLowerCase()) ||
      mentor.expertise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Sidebar />

      <div
        style={{
          marginLeft: "300px",
          padding: "30px",
        }}
      >
        <h1>Mentor Management</h1>

        <h2>{editId ? "Update Mentor" : "Add Mentor"}</h2>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <br /><br />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <br /><br />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <br /><br />

        <input
          placeholder="Expertise"
          value={form.expertise}
          onChange={(e) =>
            setForm({ ...form, expertise: e.target.value })
          }
        />

        <br /><br />

        <input
          placeholder="LinkedIn"
          value={form.linkedin}
          onChange={(e) =>
            setForm({ ...form, linkedin: e.target.value })
          }
        />

        <br /><br />

        <input
          type="text"
          placeholder="Hourly Rate"
          value={form.hourly_rate}
          onChange={(e) =>
            setForm({
              ...form,
              hourly_rate: e.target.value,
            })
          }
        />

        <br /><br />

        {editId ? (
          <>
            <button onClick={updateMentor}>
              Update Mentor
            </button>

            <button onClick={clearForm}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={createMentor}>
            Create Mentor
          </button>
        )}

        <hr style={{ margin: "30px 0" }} />

        <h2>Mentor List</h2>

        <input
          type="text"
          placeholder="Search mentor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <br /><br />

        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Expertise</th>
              <th>Hourly Rate</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredMentors.map((mentor) => (
              <tr key={mentor.id}>
                <td>{mentor.id}</td>
                <td>{mentor.name}</td>
                <td>{mentor.email}</td>
                <td>{mentor.expertise}</td>
                <td>{mentor.hourly_rate}</td>
                <td>
                  <button
                    onClick={() => editMentor(mentor)}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteMentor(mentor.id)}
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