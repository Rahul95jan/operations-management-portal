import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import axios from "axios";
import LearnerDetails from "../../components/nps/LearnerDetails";
import CourseBatchMentor from "../../components/nps/CourseBatchMentor";
import RatingQuestion from "../../components/nps/RatingQuestion";
import NPSScoreSelector from "../../components/nps/NPSScoreSelector";
import BrandPanel from "../../components/nps/wizard/BrandPanel";
import WhyItMatters from "../../components/nps/wizard/WhyItMatters";

const emptyForm = {
  learner_name: "",
  learner_email: "",
  mobile_number: "",
  course_name: "",
  batch_name: "",
  mentor_name: "",
  instructor_rating: "",
  doubt_rating: "",
  website_rating: "",
  nps_score: "",
  feedback: "",
};

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

export default function NPSPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const [formData, setFormData] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/batches").then((r) => r.json()).catch(() => []),
      fetch("http://127.0.0.1:8000/mentors").then((r) => r.json()).catch(() => []),
    ])
      .then(([batchData, mentorData]) => {
        setBatches(Array.isArray(batchData) ? batchData : []);
        setMentors(Array.isArray(mentorData) ? mentorData : []);
      })
      .finally(() => setOptionsLoading(false));
  }, []);

  const batchNames = useMemo(() => unique(batches.map((b) => b.batch_name)), [batches]);
  const courseNames = useMemo(() => unique(batches.map((b) => b.course_name)), [batches]);
  const mentorNames = useMemo(() => unique(mentors.map((m) => m.name)), [mentors]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBatchChange = (e) => {
    const batchName = e.target.value;
    const matched = batches.find((b) => b.batch_name === batchName);

    setFormData((prev) => ({
      ...prev,
      batch_name: batchName,
      course_name: matched?.course_name || prev.course_name,
      mentor_name: matched?.mentor_name || prev.mentor_name,
    }));
  };

  const handleTiltMove = (e) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({ x: py * -3, y: px * 4 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const validate = () => {
    if (!formData.learner_name.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(formData.learner_email)) return "Please enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) return "Please enter a valid 10-digit mobile number.";
    if (!formData.batch_name || !formData.course_name || !formData.mentor_name) {
      return "Please select your batch, course, and mentor.";
    }
    if (!formData.instructor_rating) return "Please rate the instructor.";
    if (!formData.doubt_rating) return "Please rate doubt resolution.";
    if (!formData.website_rating) return "Please rate the website / LMS.";
    if (formData.nps_score === "") return "Please select a score from 0-10.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const error = validate();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/nps", formData);

      if (response.data.success === false) {
        setStatus({ type: "error", message: response.data.message });
        return;
      }

      setSubmitted(true);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to connect to the server.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        <div className="layout">
          <div className="left">
            <BrandPanel courseName={formData.course_name} />
          </div>

          <div className="center">
            <div
              ref={cardRef}
              className="cardOuter"
              onMouseMove={handleTiltMove}
              onMouseLeave={resetTilt}
            >
              <div
                className="card"
                style={{
                  transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                }}
              >
                {submitted ? (
                  <div className="thankYou">
                    <div className="thankYouIcon">🎉</div>
                    <h2>Thank you!</h2>
                    <p>Your feedback has been submitted successfully. It genuinely helps us build a better experience for the next cohort.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h2 className="title">NPS Feedback</h2>
                    <p className="subtitle">Your honest feedback helps us improve every live class.</p>

                    <section className="section">
                      <div className="eyebrow">Personal Information</div>
                      <LearnerDetails formData={formData} handleChange={handleChange} />
                    </section>

                    <section className="section">
                      <div className="eyebrow">Batch &amp; Mentor</div>
                      <CourseBatchMentor
                        formData={formData}
                        handleChange={handleChange}
                        handleBatchChange={handleBatchChange}
                        batchNames={batchNames}
                        courseNames={courseNames}
                        mentorNames={mentorNames}
                        loading={optionsLoading}
                      />
                    </section>

                    <section className="section">
                      <RatingQuestion
                        number={1}
                        label="How would you rate the instructor's teaching during live sessions?"
                        name="instructor_rating"
                        value={formData.instructor_rating}
                        handleChange={handleChange}
                      />
                    </section>

                    <section className="section">
                      <RatingQuestion
                        number={2}
                        label="How effective were the instructors in addressing your doubts?"
                        name="doubt_rating"
                        value={formData.doubt_rating}
                        handleChange={handleChange}
                      />
                    </section>

                    <section className="section">
                      <RatingQuestion
                        number={3}
                        label="How user-friendly did you find our website and LMS features?"
                        name="website_rating"
                        value={formData.website_rating}
                        handleChange={handleChange}
                      />
                    </section>

                    <section className="section">
                      <NPSScoreSelector
                        number={4}
                        value={formData.nps_score}
                        handleChange={handleChange}
                        courseLabel={formData.course_name || "this course"}
                      />
                    </section>

                    <section className="section">
                      <div className="feedbackStep">
                        <div className="questionHead">
                          <span className="badge">05</span>
                          <label className="label">
                            Share your feedback <span className="optional">(optional)</span>
                          </label>
                        </div>

                        <textarea
                          rows="4"
                          name="feedback"
                          maxLength={500}
                          value={formData.feedback}
                          onChange={handleChange}
                          className="textarea"
                          placeholder="Share your experience, suggestions or ideas..."
                        />

                        <div className="charCount">{formData.feedback.length}/500</div>
                      </div>
                    </section>

                    {status && (
                      <div className={`alert ${status.type}`}>{status.message}</div>
                    )}

                    <button type="submit" disabled={loading} className="submit">
                      {loading ? "Submitting..." : "Submit Feedback ✈"}
                    </button>

                    <p className="footerNote">
                      Thank you for helping us improve your learning experience.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="right">
            <WhyItMatters />
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --font-heading: "Poppins", "Segoe UI", sans-serif;
          --font-body: "Inter", "Segoe UI", sans-serif;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: radial-gradient(circle at 15% 10%, #1a1408 0%, #0b0d12 45%, #05060a 100%);
          font-family: var(--font-body);
          padding: 24px;
        }

        .layout {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr) 260px;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }

        .left,
        .right {
          position: sticky;
          top: 24px;
        }

        @media (max-width: 980px) {
          .left,
          .right {
            position: static;
          }
        }

        .center {
          display: flex;
          justify-content: center;
          padding-top: 8px;
        }

        .cardOuter {
          width: 100%;
          max-width: 560px;
        }

        .card {
          background: #12151f;
          border: 1px solid #232838;
          border-radius: 20px;
          padding: 32px 34px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          transition: transform 0.12s ease;
          will-change: transform;
        }

        .thankYou {
          text-align: center;
          padding: 60px 10px;
        }

        .thankYouIcon {
          font-size: 46px;
          margin-bottom: 16px;
        }

        .thankYou h2 {
          font-family: var(--font-heading);
          color: #f8fafc;
          font-size: 24px;
          margin: 0 0 10px;
        }

        .thankYou p {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .title {
          font-family: var(--font-heading);
          color: #f8fafc;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .subtitle {
          color: #64748b;
          font-size: 13px;
          margin: 0 0 26px;
        }

        .section {
          padding: 22px 0;
          border-top: 1px solid #1e2436;
        }

        .section:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #facc15;
          margin-bottom: 16px;
        }

        .feedbackStep {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .questionHead {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(250, 204, 21, 0.1);
          border: 1px solid rgba(250, 204, 21, 0.35);
          color: #facc15;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .label {
          font-size: 16px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .optional {
          color: #64748b;
          font-weight: 400;
          font-size: 13px;
        }

        .textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1.5px solid #334155;
          background: #1a2032;
          color: #f1f5f9;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .textarea::placeholder {
          color: #64748b;
        }

        .textarea:focus {
          border-color: #facc15;
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
        }

        .charCount {
          align-self: flex-end;
          font-size: 11px;
          color: #64748b;
        }

        .alert {
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 20px;
        }

        .alert.error {
          background: rgba(220, 38, 38, 0.12);
          color: #fca5a5;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .alert.success {
          background: rgba(22, 163, 74, 0.12);
          color: #86efac;
          border: 1px solid rgba(22, 163, 74, 0.3);
        }

        .submit {
          width: 100%;
          margin-top: 24px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1c1400;
          border: none;
          padding: 15px;
          border-radius: 10px;
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.15s ease;
          box-shadow: 0 10px 24px rgba(245, 158, 11, 0.3);
        }

        .submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(245, 158, 11, 0.45);
        }

        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .footerNote {
          text-align: center;
          font-size: 11px;
          color: #475569;
          margin: 16px 0 0;
        }
      `}</style>
    </>
  );
}
