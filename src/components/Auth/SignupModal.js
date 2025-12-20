import React from 'react';
import './SignupModal.css';

const SignupModal = ({ onClose, onSignup, onLogin }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>🎉 You've used your free check!</h2>
        </div>

        <div className="modal-body">
          <p>Sign up for <strong>50 free checks per month</strong></p>

          <ul className="benefits-list">
            <li>✓ 50 VM availability checks per month</li>
            <li>✓ API key for CLI automation</li>
            <li>✓ Historical data access</li>
            <li>✓ CSV export functionality</li>
          </ul>

          <div className="modal-actions">
            <button className="btn-primary" onClick={onSignup}>
              Create Free Account
            </button>
            <button className="btn-secondary" onClick={onLogin}>
              I have an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
