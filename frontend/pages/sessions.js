import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    topic: "",
    mentor_name: "",
    batch_name: "",
    session_date: "",
    session_time: "",
    status: "Scheduled",
  });

  const loadSessions = async () => {
    const res = await fetch("http://127.0.0.1:8000/sessions");
    const data = await res.json();
    setSessions(data);
  };

  const loadMentors = async () => {
    const res = await fetch("http://127.0.0.1:8000/mentors");
    const data = await res.json();
    setMentors(data);
  };

  const loadBatches = async () => {
    const res = await fetch("http://127.0.0.1:8000/batches");
    const data = await res.json();
    setBatches(data);
  };

  useEffect(() => {
    loadSessions();
    loadMentors();
    loadBatches();
  }, []);

  const resetForm = () => {
    setForm({
      topic: "",
      mentor_name: "",
      batch_name: "",
      session_date: "",
      session_time: "",
      status: "Scheduled",
    });

    setEditId(null);
  };

  const createSession = async () => {
    await fetch("http://127.0.0.1:8000/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    loadSessions();
    resetForm();
  };

  const updateSession = async () => {
    await fetch(`http://127.0.0.1:8000/sessions/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    loadSessions();
    resetForm();
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;

    await fetch(`http://127.0.0.1:8000/sessions/${id}`, {
      method: "DELETE",
    });

    loadSessions();
  };

  const editSession = (session) => {
    setEditId(session.id);

    setForm({
      topic: session.topic,
      mentor_name: session.mentor_name,
      batch_name: session.batch_name,
      session_date: session.session_date,
      session_time: session.session_time,
      status: session.status,
    });
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.topic
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      session.mentor_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      session.batch_name
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
        <h1>Session Management</h1>

        <h2>
          {editId
            ? "Update Session"
            : "Create Session"}
        </h2>

        <input
          placeholder="Topic"
          value={form.topic}
          onChange={(e) =>
            setForm({
              ...form,
              topic: e.target.value,
            })
          }
        />

        <br />
        <br />

        <select
          value={form.mentor_name}
          onChange={(e) =>
            setForm({
              ...form,
              mentor_name: e.target.value,
            })
          }
        >
          <option value="">
            Select Mentor
          </option>

          {mentors.map((mentor) => (
            <option
              key={mentor.id}
              value={mentor.name}
            >
              {mentor.name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <select
          value={form.batch_name}
          onChange={(e) =>
            setForm({
              ...form,
              batch_name: e.target.value,
            })
          }
        >
          <option value="">
            Select Batch
          </option>

          {batches.map((batch) => (
            <option
              key={batch.id}
              value={batch.batch_name}
            >
              {batch.batch_name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <input
          type="date"
          value={form.session_date}
          onChange={(e) =>
            setForm({
              ...form,
              session_date: e.target.value,
            })
          }
        />

        <br />
        <br />

        <input
          type="time"
          value={form.session_time}
          onChange={(e) =>
            setForm({
              ...form,
              session_time: e.target.value,
            })
          }
        />

        <br />
        <br />

        <select
          value={form.status}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value,
            })
          }
        >
          <option value="Scheduled">
            Scheduled
          </option>
          <option value="Completed">
            Completed
          </option>
          <option value="Cancelled">
            Cancelled
          </option>
        </select>

        <br />
        <br />

        {editId ? (
          <>
            <button
              onClick={updateSession}
            >
              Update Session
            </button>

            <button
              onClick={resetForm}
              style={{
                marginLeft: "10px",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={createSession}
          >
            Create Session
          </button>
        )}

        <hr
          style={{
            margin: "30px 0",
          }}
        />

        <h2>Session List</h2>
        <div
  style={{
    marginBottom: "20px",
  }}
>
  <a
    href="http://127.0.0.1:8000/export-sessions"
    target="_blank"
    rel="noreferrer"
  >
    <button
      style={{
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      📥 Export Sessions Excel
    </button>
  </a>
</div>

        <input
          type="text"
          placeholder="Search Session..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            padding: "10px",
            width: "300px",
            marginBottom: "20px",
            borderRadius: "6px",
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
              <th>Topic</th>
              <th>Mentor</th>
              <th>Batch</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSessions.map(
              (session) => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.topic}</td>
                  <td>
                    {session.mentor_name}
                  </td>
                  <td>
                    {session.batch_name}
                  </td>
                  <td>
                    {session.session_date}
                  </td>
                  <td>
                    {session.session_time}
                  </td>
                  <td>
                    {session.status}
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        editSession(session)
                      }
                      style={{
                        marginRight:
                          "10px",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteSession(
                          session.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}