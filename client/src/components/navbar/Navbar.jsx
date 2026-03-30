import React, { useContext } from "react";
import { DarkModeContext } from "../../context/DarkMode";
import { useNavigate } from "react-router-dom";
import "./Navbar.scss";

function Navbar() {
  const { darkMode, toggle } = useContext(DarkModeContext);
  const navigate = useNavigate();
  const getCurrentUserFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload; // { id, username, … }
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUserFromToken();
  const handeleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
    window.location.reload();
  };
  return (
    <header className={`navbar ${darkMode ? "dark" : "light"}`}>
      <div className="navbar-container">
        {/* اليسار: اللوجو */}
        <div className="navbar-left">
          <div className="logo-wrapper" onClick={() => navigate("/posts")}>
            <span className="logo-text">Instagram</span>
          </div>
        </div>

        {/* اليمين: الأزرار */}
        <div className="navbar-right">
          {/* زر تبديل الثيم */}
          <button
            className="nav-icon-btn"
            onClick={toggle}
            title="Toggle Theme"
          >
            {darkMode ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            className="nav-icon-btn"
            onClick={() => navigate(`/profile/${currentUser.userId}`)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <button className="nav-icon-btn" onClick={handeleLogout}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
