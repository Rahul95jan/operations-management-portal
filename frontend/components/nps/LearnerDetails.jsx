const fields = [
  { name: "learner_name", label: "Full Name", type: "text", icon: "👤" },
  { name: "learner_email", label: "Email Address", type: "email", icon: "✉️" },
  { name: "mobile_number", label: "Phone Number", type: "tel", maxLength: 10, icon: "📱" },
];

export default function LearnerDetails({ formData, handleChange }) {
  return (
    <div className="grid">
      {fields.map((field) => (
        <div key={field.name} className="field">
          <div className="inputWrap">
            <span className="icon">{field.icon}</span>
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              maxLength={field.maxLength}
              className="input"
              placeholder={`${field.label} *`}
              required
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        .field:last-child {
          grid-column: 1 / -1;
        }

        .inputWrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .icon {
          position: absolute;
          left: 14px;
          font-size: 14px;
          opacity: 0.7;
          pointer-events: none;
        }

        .input {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid #334155;
          background: #1a2032;
          color: #f1f5f9;
          border-radius: 10px;
          padding: 13px 14px 13px 38px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .input::placeholder {
          color: #64748b;
        }

        .input:focus {
          border-color: #facc15;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
        }
      `}</style>
    </div>
  );
}
