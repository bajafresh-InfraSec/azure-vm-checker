import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <a href="/" className="back-link">← Back to VM Checker</a>

      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={handleSignOut} className="btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Usage Stats */}
        <div className="dashboard-card">
          <h2>Usage This Month</h2>
          <div className="usage-display">
            <div className="usage-number">
              0 / 50
            </div>
            <div className="usage-label">checks used</div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: '0%' }}
            />
          </div>
          <p className="usage-remaining">
            50 checks remaining
          </p>
          <p style={{marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center'}}>
            Usage tracking will be available once backend authentication is deployed.
          </p>
        </div>

        {/* API Keys */}
        <div className="dashboard-card">
          <h2>API Keys</h2>
          <p style={{color: '#666', marginBottom: '20px'}}>
            API key generation will be available once backend is deployed.
          </p>

          <p style={{fontSize: '14px', color: '#999', marginTop: '20px'}}>
            Coming soon: Generate API keys for CLI access
          </p>
        </div>

        {/* CLI Instructions */}
        <div className="dashboard-card">
          <h2>CLI Setup</h2>
          <ol className="cli-instructions">
            <li>Install the CLI:
              <code>npm install -g azsize</code>
            </li>
            <li>Authenticate with your API key:
              <code>azsize auth key YOUR_API_KEY</code>
            </li>
            <li>Start checking VMs:
              <code>azsize check Standard_D4s_v5 --region eastus</code>
            </li>
          </ol>
        </div>

        {/* Account Info */}
        <div className="dashboard-card">
          <h2>Account</h2>
          <div style={{marginBottom: '15px'}}>
            <strong>Email:</strong> {user.email}
          </div>
          <div style={{marginBottom: '15px'}}>
            <strong>Plan:</strong> Free (50 checks/month)
          </div>
          <div style={{marginBottom: '15px'}}>
            <strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
