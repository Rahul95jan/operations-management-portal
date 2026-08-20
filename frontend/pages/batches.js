import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    batch_name: "",
    course_name: "",
    strength: "",
    mentor_name: "",
  });

  const loadBatches = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/batches");
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const clearForm = () => {
    setForm({
      batch_name: "",
      course_name: "",
      strength: "",
      mentor_name: "",
    });

    setEditId(null);
  };

  const createBatch = async () => {
    await fetch("http://127.0.0.1:8000/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        strength: Number(form.strength),
      }),
    });

    loadBatches();
    clearForm();
  };

  const updateBatch = async () => {
    await fetch(`http://127.0.0.1:8000/batches/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        strength: Number(form.strength),
      }),
    });

    loadBatches();
    clearForm();
  };

  const deleteBatch = async (id) => {
    if (!window.confirm("Delete this batch?")) {
      return;
    }

    await fetch(`http://127.0.0.1:8000/batches/${id}`, {
      method: "DELETE",
    });

    loadBatches();
  };

  const editBatch = (batch) => {
    setEditId(batch.id);

    setForm({
      batch_name: batch.batch_name,
      course_name: batch.course_name,
      strength: batch.strength,
      mentor_name: batch.mentor_name,
    });
  };

  const filteredBatches = batches.filter((batch) =>
    batch.batch_name
      .toLowerCase()
      .includes(search.toLowerCase())
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
        <h1>Batch Management</h1>

        <h2>
          {editId ? "Update Batch" : "Create Batch"}
        </h2>

        <input
          placeholder="Batch Name"
          value={form.batch_name}
          onChange={(e) =>
            setForm({
              ...form,
              batch_name: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Course Name"
          value={form.course_name}
          onChange={(e) =>
            setForm({
              ...form,
              course_name: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Strength"
          value={form.strength}
          onChange={(e) =>
            setForm({
              ...form,
              strength: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Mentor Name"
          value={form.mentor_name}
          onChange={(e) =>
            setForm({
              ...form,
              mentor_name: e.target.value,
            })
          }
        />

        <br /><br />

        {editId ? (
          <>
            <button
              onClick={updateBatch}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 15px",
                borderRadius: "6px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Update Batch
            </button>

            <button
              onClick={clearForm}
              style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "10px 15px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={createBatch}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Create Batch
          </button>
        )}

        <hr style={{ margin: "30px 0" }} />

        <h2>Batch List</h2>

        <input
          type="text"
          placeholder="Search Batch..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            padding: "10px",
            width: "300px",
            marginBottom: "20px",
          }}
        />

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
              <th>Batch Name</th>
              <th>Course</th>
              <th>Strength</th>
              <th>Mentor</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBatches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.id}</td>
                <td>{batch.batch_name}</td>
                <td>{batch.course_name}</td>
                <td>{batch.strength}</td>
                <td>{batch.mentor_name}</td>

                <td>
                  <button
                    onClick={() => editBatch(batch)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginRight: "10px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteBatch(batch.id)
                    }
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
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