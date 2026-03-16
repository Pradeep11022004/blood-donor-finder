import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>BloodLink</h5>
            <p className="mb-0">Connecting donors with those in need</p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="mb-2">
              <a href="#privacy" className="text-light text-decoration-none me-3">Privacy</a>
              <a href="#terms" className="text-light text-decoration-none me-3">Terms</a>
              <a href="#contact" className="text-light text-decoration-none">Contact</a>
            </div>
            <small>© 2025 BloodLink. All rights reserved.</small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;