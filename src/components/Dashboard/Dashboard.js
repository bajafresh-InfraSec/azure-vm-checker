import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://www.azsize.com';

const Dashboard = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsageStats(), fetchApiKeys()]);
    setLoading(false);
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/usage-stats`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at, revoked')
        .eq('user_id', user.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      alert('Please enter a name for your API key');
      return;
    }

    setGeneratingKey(true);
    try {
      const response = await fetch(`${API_URL}/api/generate-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newApiKeyName })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.apiKey);
        setNewApiKeyName('');
        await fetchApiKeys();
      } else {
        const error = await response.json();
        alert(`Failed to generate API key: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked: true })
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (!error) {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

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
          {usageStats ? (
            <>
              <div className="usage-display">
                <div className="usage-number">
                  {usageStats.used} / {usageStats.limit}
                </div>
                <div className="usage-label">checks used</div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${usageStats.percentage}%` }}
                />
              </div>
              <p className="usage-remaining">
                {usageStats.remaining} checks remaining
              </p>
              <p style={{marginTop: '15px', fontSize: '12px', color: '#999', textAlign: 'center'}}>
                Period: {new Date(usageStats.period.start).toLocaleDateString()} - {new Date(usageStats.period.end).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p style={{color: '#666', textAlign: 'center'}}>Loading usage stats...</p>
          )}
        </div>

        {/* API Keys */}
        <div className="dashboard-card">
          <h2>API Keys</h2>

          {generatedKey && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <strong style={{color: '#155724'}}>Your new API key:</strong>
              <code style={{
                display: 'block',
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'white',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                fontSize: '14px',
                wordBreak: 'break-all'
              }}>
                {generatedKey}
              </code>
              <p style={{fontSize: '12px', color: '#856404', marginTop: '10px'}}>
                ⚠️ Save this key now - it won't be shown again!
              </p>
              <button
                onClick={() => setGeneratedKey(null)}
                style={{marginTop: '10px', padding: '5px 10px', fontSize: '12px'}}
              >
                Close
              </button>
            </div>
          )}

          <div style={{marginBottom: '20px'}}>
            <input
              type="text"
              placeholder="Enter key name (e.g., 'My Laptop')"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
            <button
              onClick={generateApiKey}
              disabled={generatingKey}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#0078D4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: generatingKey ? 'not-allowed' : 'pointer'
              }}
            >
              {generatingKey ? 'Generating...' : 'Generate New API Key'}
            </button>
          </div>

          {apiKeys.length > 0 ? (
            <div>
              <h3 style={{fontSize: '16px', marginBottom: '10px'}}>Your API Keys</h3>
              {apiKeys.map(key => (
                <div key={key.id} style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div><strong>{key.name}</strong></div>
                    <div style={{fontSize: '12px', color: '#666'}}>
                      {key.key_prefix}... • Created {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    {key.last_used_at && (
                      <div style={{fontSize: '11px', color: '#999'}}>
                        Last used: {new Date(key.last_used_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => revokeApiKey(key.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{fontSize: '14px', color: '#999', textAlign: 'center'}}>
              No API keys yet. Generate one to use the CLI.
            </p>
          )}
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
