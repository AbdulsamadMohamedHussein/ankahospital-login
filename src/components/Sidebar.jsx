import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#1e3a8a",
      color: "white",
      padding: "20px"
    }}>
      <h2>ANKA</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/admin" style={link}>Admin</Link></li>
        <li><Link to="/doctor" style={link}>Doctor</Link></li>
        <li><Link to="/nurse" style={link}>Nurse</Link></li>
        <li><Link to="/reception" style={link}>Reception</Link></li>
        <li><Link to="/lab" style={link}>Lab</Link></li>
        <li><Link to="/pharmacy" style={link}>Pharmacy</Link></li>
        <li><Link to="/radiology" style={link}>Radiology</Link></li>
      </ul>
    </div>
  );
}

const link = {
  color: "white",
  textDecoration: "none",
  display: "block",
  padding: "10px 0"
};

export default Sidebar;                                         