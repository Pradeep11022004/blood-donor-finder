import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-professional shadow-sm fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" onClick={closeMenu}>
          🩸 Blood Donor Network
        </Link>
        
        {/* Hamburger Button */}
        <button 
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Menu */}
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/"
                onClick={closeMenu}
              >
                <i className="bi bi-house me-1"></i>Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/search"
                onClick={closeMenu}
              >
                <i className="bi bi-search me-1"></i>Find Donors
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to="/register"
                onClick={closeMenu}
              >
                <i className="bi bi-person-plus me-1"></i>Register
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;