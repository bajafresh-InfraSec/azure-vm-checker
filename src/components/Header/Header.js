import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="App-header">
      <img
        src="/FinderBanner.png"
        alt="AZSize.com - Azure VM Availability Finder"
        className="banner-logo"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      />
      {user && (
        <div className="header-user-section">
          <span className="user-email">{user.email}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-dashboard"
          >
            Dashboard
          </button>
        </div>
      )}
      {!user && (
        <div className="header-auth-links">
          <button onClick={() => navigate('/login')} className="btn-login">
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="btn-signup">
            Sign Up
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
