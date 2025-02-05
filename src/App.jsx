import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import DiagnosisMedicines from "./Diagnosis-Medicines"; 

function App() {
  const location = useLocation();

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        <a href="#" className="brand-link">
          <span className="brand-text font-weight-light">SKP Clinic Doctor</span>
        </a>
        <div className="sidebar">
          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              role="menu"
              data-accordion="false"
            >
              <li className="nav-item">
                <Link
                  to="/"
                  className={`nav-link ${
                    location.pathname === "/" ? "active" : ""
                  }`}
                >
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Dashboard</p>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/diagnosis-medicines"
                  className={`nav-link ${
                    location.pathname === "/diagnosis-medicines" ? "active" : ""
                  }`}
                >
                  <i className="nav-icon fas fa-pills"></i>
                  <p>Diagnosis & Medicines</p>
                </Link>
              </li>

            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnosis-medicines" element={<DiagnosisMedicines />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
