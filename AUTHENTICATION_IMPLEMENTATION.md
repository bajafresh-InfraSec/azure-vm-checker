# Authentication & Rate Limiting Implementation Plan

**Created:** December 19, 2025
**Status:** Ready to implement
**Estimated Time:** 16-20 hours (MVP)

---

## 🎯 Requirements Summary

### Website
- ✅ Allow **1 free VM check** without login (anonymous users)
- ✅ After 1st check, prompt for signup/login
- ✅ Signed-in users: **50 checks per month** (free tier)

### CLI
- ✅ Require API key from first use
- ✅ Users get API key after signup at www.azsize.com
- ✅ **50 checks per month** (free tier)

### Future (Pro Tier)
- Unlimited checks
- Advanced features
- Priority support

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Anonymous  │  │  Login   │  │  Signup   │  │Dashboard │ │
│  │ (1 check)  │  │          │  │           │  │          │ │
│  └────────────┘  └──────────┘  └───────────┘  └──────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Azure Functions (Backend)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Middleware (checkAuth + checkRateLimit)        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │GetVMAvail    │  │GetHistorical │  │Auth Endpoints   │   │
│  │(with auth)   │  │(with auth)   │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Auth + DB)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │ Profiles │  │ API Keys │  │Usage Logs  │  │
│  │ (built-in)│ │          │  │          │  │            │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Implementation

### **Phase 1: Supabase Setup** (2 hours)

#### Step 1.1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project:
   - Name: `azsize-auth`
   - Database Password: z2LudinNu3Eyzx7n
   - Region: `East US` (closest to Azure West US 2)
4. Wait 2-3 minutes for provisioning

#### Step 1.2: Save Credentials
Once project is ready, get these from Settings > API:
```
SUPABASE_URL: https://epnrjmqjiqjndgbqaemx.supabase.co
SUPABASE_ANON_KEY:sb_publishable_1R5I393AiMKDIIFIQj5OzA_Do1s3RoS
SUPABASE_SERVICE_KEY: sb_secret_41Fsnwv4hmgBQFfUE13dnA_lx8zSRm9
```

#### Step 1.3: Create Database Schema
Go to SQL Editor in Supabase, run this:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for CLI access
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT DEFAULT 'Default Key',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Usage logs for rate limiting
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  vm_size TEXT,
  region TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_usage_logs_user_timestamp ON usage_logs(user_id, timestamp);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Step 1.4: Configure Email Templates
In Supabase Dashboard > Authentication > Email Templates:
- Customize "Confirm signup" email
- Customize "Reset password" email
- Add your branding

---

### **Phase 2: Frontend - Anonymous Rate Limiting** (2 hours)

#### Step 2.1: Create localStorage Helper
Create `src/utils/anonymousRateLimit.js`:

```javascript
export const ANONYMOUS_LIMIT = 1;

export function checkAnonymousLimit() {
  const data = JSON.parse(localStorage.getItem('azsize_anonymous') || '{}');

  if (!data.checksUsed) {
    return { allowed: true, remaining: ANONYMOUS_LIMIT, used: 0 };
  }

  if (data.checksUsed >= ANONYMOUS_LIMIT) {
    return { allowed: false, remaining: 0, used: data.checksUsed };
  }

  return {
    allowed: true,
    remaining: ANONYMOUS_LIMIT - data.checksUsed,
    used: data.checksUsed
  };
}

export function incrementAnonymousUsage() {
  const data = JSON.parse(localStorage.getItem('azsize_anonymous') || '{}');
  data.checksUsed = (data.checksUsed || 0) + 1;
  data.lastCheckAt = new Date().toISOString();
  localStorage.setItem('azsize_anonymous', JSON.stringify(data));
}

export function resetAnonymousUsage() {
  localStorage.removeItem('azsize_anonymous');
}
```

#### Step 2.2: Create Signup Modal
Create `src/components/Auth/SignupModal.js`:

```javascript
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
```

#### Step 2.3: Update VMChecker.js
Add anonymous tracking to VMChecker component:

```javascript
import { checkAnonymousLimit, incrementAnonymousUsage } from '../utils/anonymousRateLimit';
import SignupModal from './Auth/SignupModal';

// In VMChecker component:
const [showSignupModal, setShowSignupModal] = useState(false);
const [isAuthenticated, setIsAuthenticated] = useState(false);

const checkAvailability = async () => {
  // Check if user is authenticated
  if (!isAuthenticated) {
    const limit = checkAnonymousLimit();
    if (!limit.allowed) {
      setShowSignupModal(true);
      return;
    }
  }

  setLoading(true);
  setError(null);

  try {
    // ... existing check logic

    // Increment anonymous usage if not authenticated
    if (!isAuthenticated) {
      incrementAnonymousUsage();
    }

    // ... rest of existing logic
  } catch (err) {
    // ... error handling
  }
};
```

---

### **Phase 3: Frontend - Auth Components** (4 hours)

#### Step 3.1: Install Supabase
```bash
cd C:\Users\jazzs\projects\azure-vm-checker
npm install @supabase/supabase-js
```

#### Step 3.2: Create Supabase Client
Create `src/utils/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create `.env` file:
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

#### Step 3.3: Create Auth Context
Create `src/context/AuthContext.js`:

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

#### Step 3.4: Create Login Component
Create `src/components/Auth/Login.js`:

```javascript
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Login to azsize.com</h1>
        <p>Access your 50 free checks per month</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
          <p><a href="/forgot-password">Forgot password?</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

#### Step 3.5: Create Signup Component
Create `src/components/Auth/Signup.js`:

```javascript
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box success">
          <h1>✓ Check your email!</h1>
          <p>We've sent a confirmation link to <strong>{email}</strong></p>
          <p>Click the link in the email to activate your account.</p>
          <a href="/login" className="btn-primary">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Create your account</h1>
        <p>Get 50 free VM checks per month + CLI access</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="/login">Login</a></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
```

---

### **Phase 4: Backend - API Updates** (4-6 hours)

#### Step 4.1: Install Supabase in Functions
```bash
cd C:\Users\jazzs\projects\azure-vm-checker\api
npm install @supabase/supabase-js
npm install crypto
```

#### Step 4.2: Create Supabase Client for Backend
Create `api/shared/supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

module.exports = createClient(supabaseUrl, supabaseServiceKey);
```

#### Step 4.3: Create Auth Middleware
Create `api/shared/auth.js`:

```javascript
const supabase = require('./supabase');
const crypto = require('crypto');

async function checkAuth(req) {
  // 1. Check for API key (CLI usage)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, profiles(*)')
      .eq('key_hash', keyHash)
      .eq('revoked', false)
      .single();

    if (error || !keyData) {
      return { error: 'Invalid API key', status: 401 };
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return { user: keyData.profiles, apiKeyId: keyData.id };
  }

  // 2. Check for session token (website usage)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid session', status: 401 };
    }

    return { user: { id: user.id, email: user.email } };
  }

  // 3. No auth = anonymous
  return { anonymous: true };
}

async function checkRateLimit(userId, planType = 'free') {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count, error } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth.toISOString());

  if (error) {
    return { exceeded: false, count: 0, limit: 50, error };
  }

  const limit = planType === 'free' ? 50 : 999999; // Future: Pro = unlimited

  if (count >= limit) {
    return { exceeded: true, count, limit };
  }

  return { exceeded: false, count, limit };
}

async function logUsage(userId, apiKeyId, endpoint, vmSize, region, req) {
  await supabase.from('usage_logs').insert({
    user_id: userId,
    api_key_id: apiKeyId,
    endpoint,
    vm_size: vmSize,
    region,
    ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
    user_agent: req.headers['user-agent']
  });
}

module.exports = { checkAuth, checkRateLimit, logUsage };
```

#### Step 4.4: Update GetVMAvailability Function
Update `api/GetVMAvailability/index.js`:

```javascript
const { checkAuth, checkRateLimit, logUsage } = require('../shared/auth');

module.exports = async function (context, req) {
  // Check authentication
  const auth = await checkAuth(req);

  // If anonymous, allow but don't track (frontend handles limit)
  // If authenticated, check rate limit
  if (auth.user && !auth.anonymous) {
    const rateLimit = await checkRateLimit(auth.user.id);

    if (rateLimit.exceeded) {
      context.res = {
        status: 429,
        body: {
          error: 'Rate limit exceeded',
          usage: { used: rateLimit.count, limit: rateLimit.limit },
          message: 'Upgrade to Pro for unlimited checks'
        }
      };
      return;
    }
  }

  // ... existing VM availability logic ...

  // Log usage if authenticated
  if (auth.user && !auth.anonymous) {
    await logUsage(
      auth.user.id,
      auth.apiKeyId,
      'check',
      vmSize,
      region,
      req
    );
  }

  // ... return results ...
};
```

---

### **Phase 5: API Key Generation** (2 hours)

#### Step 5.1: Create GenerateAPIKey Function
Create `api/GenerateAPIKey/index.js`:

```javascript
const supabase = require('../shared/supabase');
const crypto = require('crypto');

function generateAPIKey() {
  // Format: azsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const random = crypto.randomBytes(24).toString('hex');
  return `azsk_${random}`;
}

module.exports = async function (context, req) {
  // Get user from auth header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    context.res = { status: 401, body: { error: 'Unauthorized' } };
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    context.res = { status: 401, body: { error: 'Invalid session' } };
    return;
  }

  // Generate API key
  const apiKey = generateAPIKey();
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 12) + '...';

  // Store in database
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: req.body?.name || 'Default Key'
    })
    .select()
    .single();

  if (error) {
    context.res = { status: 500, body: { error: error.message } };
    return;
  }

  context.res = {
    status: 200,
    body: {
      apiKey: apiKey, // Only shown once!
      keyId: data.id,
      keyPrefix: keyPrefix,
      message: 'Save this key! It will not be shown again.'
    }
  };
};
```

Create `api/GenerateAPIKey/function.json`:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"],
      "route": "generate-api-key"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

---

### **Phase 6: User Dashboard** (4 hours)

Create `src/components/Dashboard/Dashboard.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import './Dashboard.css';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [apiKey, setApiKey] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    // Fetch API keys
    const { data: keys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('revoked', false);

    setApiKeys(keys || []);

    // Fetch usage for current month
    const response = await fetch('/api/get-usage-stats', {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setUsage(data.usage);
    }

    setLoading(false);
  }

  async function generateNewKey() {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch('/api/generate-api-key', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'CLI Key' })
    });

    if (response.ok) {
      const data = await response.json();
      setApiKey(data.apiKey);
      setShowNewKey(true);
      fetchData();
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={signOut} className="btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Usage Stats */}
        <div className="dashboard-card">
          <h2>Usage This Month</h2>
          <div className="usage-display">
            <div className="usage-number">
              {usage.used} / {usage.limit}
            </div>
            <div className="usage-label">checks used</div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(usage.used / usage.limit) * 100}%` }}
            />
          </div>
          <p className="usage-remaining">
            {usage.limit - usage.used} checks remaining
          </p>
        </div>

        {/* API Keys */}
        <div className="dashboard-card">
          <h2>API Keys</h2>

          {showNewKey && apiKey && (
            <div className="new-key-alert">
              <p><strong>⚠️ Save this key! It won't be shown again.</strong></p>
              <div className="key-display">
                <code>{apiKey}</code>
                <button onClick={() => copyToClipboard(apiKey)}>📋 Copy</button>
              </div>
              <button onClick={() => setShowNewKey(false)}>I've saved it</button>
            </div>
          )}

          {apiKeys.length === 0 ? (
            <p>No API keys yet. Generate one to use the CLI.</p>
          ) : (
            <div className="keys-list">
              {apiKeys.map(key => (
                <div key={key.id} className="key-item">
                  <code>{key.key_prefix}</code>
                  <span className="key-date">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button onClick={generateNewKey} className="btn-primary">
            Generate New API Key
          </button>
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
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 🚀 Deployment Steps

### 1. Environment Variables

**Azure Static Web Apps (Frontend):**
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

**Azure Functions (Backend):**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (service key, not anon key!)
```

### 2. Deploy Frontend
```bash
cd C:\Users\jazzs\projects\azure-vm-checker
git add .
git commit -m "Add authentication and rate limiting"
git push
```

### 3. Test Flow
1. Visit www.azsize.com
2. Do 1 VM check (works)
3. Try 2nd check (prompted to signup)
4. Sign up with email
5. Verify email
6. Login to dashboard
7. Generate API key
8. Use API key in CLI

---

## 📊 Success Metrics

- [ ] Anonymous users: 1 free check works
- [ ] Signup flow: Email verification works
- [ ] Dashboard: Shows API key correctly
- [ ] API: Rate limiting enforces 50/month
- [ ] CLI: Auth commands work
- [ ] Error handling: Clear messages on limits

---

## 🎯 Next Steps After MVP

1. Add Google OAuth (1-click signup)
2. Add usage charts to dashboard
3. Implement Pro tier (unlimited checks)
4. Add email notifications at 80% usage
5. Multi-region API keys

---

**Ready to implement?** Start with Phase 1: Supabase Setup!
