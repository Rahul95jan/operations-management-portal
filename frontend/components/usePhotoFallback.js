import { useEffect, useState } from "react";

// Tracks whether a photo URL failed to load (e.g. the file is gone after a
// server redeploy) so callers can fall back to initials instead of showing a
// broken image with its alt text spilling out of the avatar circle.
//
// A hook rather than a component on purpose: callers style their avatars with
// scoped <style jsx>, which wouldn't reach markup rendered by another component.
export function usePhotoFallback(src) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return { showPhoto: Boolean(src) && !broken, onPhotoError: () => setBroken(true) };
}
