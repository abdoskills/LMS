import React from 'react';
import '@/app/footer.css';

export default function Footer() {
  return (
    <footer className="dashboard-footer">
      <div className="footer-content">
        {/* About Section */}
        <div className="footer-section">
          <div className="footer-logo">
            <i className="fas fa-graduation-cap"></i>
            <h3>EduMaster</h3>
          </div>
            <div className="footer-about">
            <p>
              Empowering instructors to create and manage exceptional learning experiences. Share your knowledge with students worldwide.
            </p>
            <div className="social-links">
              <a href="https://github.com/abdoskills" className="social-link" target="_blank" rel="noreferrer" title="GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="social-link" title="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" title="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4>Contact Info</h4>
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-user"></i>
              <span>Abdelrahman Mohamed</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <a href="tel:+201098857028">01098857028</a>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <a href="mailto:contact@abdoskills.com">contact@abdoskills.com</a>
            </div>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>Cairo, Egypt</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#"><i className="fas fa-chevron-right"></i> Dashboard</a></li>
            <li><a href="#"><i className="fas fa-chevron-right"></i> My Courses</a></li>
            <li><a href="#"><i className="fas fa-chevron-right"></i> Students</a></li>
            <li><a href="#"><i className="fas fa-chevron-right"></i> Analytics</a></li>
            <li><a href="#"><i className="fas fa-chevron-right"></i> Settings</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-section">
          <h4>Newsletter</h4>
          <div className="newsletter">
            <p>Subscribe to get updates on new features and teaching tips.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">© 2024 Abdelrahman Instructor Dashboard. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
          <a href="https://github.com/abdoskills" target="_blank" rel="noreferrer">GitHub Profile</a>
        </div>
      </div>
    </footer>
  );
}
