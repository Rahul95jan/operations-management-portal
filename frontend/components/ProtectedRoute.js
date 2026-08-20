import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    const loggedIn =
      localStorage.getItem("loggedIn");

    if (!loggedIn) {
      router.push("/login");
    }
  }, []);

  return children;
}