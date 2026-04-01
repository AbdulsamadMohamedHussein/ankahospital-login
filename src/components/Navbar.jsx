function Navbar() {
  return (
    <div style={{
      height: "60px",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      borderBottom: "1px solid #ddd"
    }}>
      <h3>Dashboard</h3>
      <p>Welcome 👋</p>
    </div>
  );
}

export default Navbar;