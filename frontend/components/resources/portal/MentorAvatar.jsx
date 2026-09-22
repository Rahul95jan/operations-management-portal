import { initials, mentorPhotoUrl } from "./portalUtils";

// Round mentor photo (as uploaded in the Mentors section) with an initials fallback.
export default function MentorAvatar({ mentor, name, size = 32 }) {
  const url = mentorPhotoUrl(mentor);
  const label = mentor?.name || name || "";
  const box = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };

  return (
    <>
      {url ? (
        <img src={url} alt={label} className="ma ma-img" style={box} loading="lazy" />
      ) : (
        <span className="ma ma-fallback" style={box} aria-label={label}>{initials(label)}</span>
      )}
      <style jsx>{`
        .ma { border-radius: 50%; flex-shrink: 0; }
        .ma-img { object-fit: cover; border: 1px solid #e3eaf4; }
        .ma-fallback { display: inline-flex; align-items: center; justify-content: center; background: rgba(245, 158, 11, 0.15); color: #b45309; font-weight: 800; }
      `}</style>
    </>
  );
}
