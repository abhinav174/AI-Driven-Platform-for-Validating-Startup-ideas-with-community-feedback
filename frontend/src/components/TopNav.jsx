import { Link, useLocation } from "react-router-dom";

export default function TopNav() {
  const location = useLocation();

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  return (
    <nav className="top-nav">
      <Link className="brand-mark" to="/dashboard">FounderHub AI</Link>
      <div className="nav-links">
        <Link className={isActive("/dashboard") ? "nav-link active" : "nav-link"} to="/dashboard">Dashboard</Link>
        <Link className={isActive("/network") ? "nav-link active" : "nav-link"} to="/network">Network</Link>
        <Link className={isActive("/messages") ? "nav-link active" : "nav-link"} to="/messages">Messages</Link>
        <Link className={isActive("/profile") ? "nav-link active" : "nav-link"} to="/profile">Profile</Link>
      </div>
    </nav>
  );
}
