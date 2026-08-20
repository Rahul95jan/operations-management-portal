import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />

      <div
        style={{
          marginLeft: "270px",
          padding: "30px",
        }}
      >
        {children}
      </div>
    </>
  );
}