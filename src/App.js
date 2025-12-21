import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import VMChecker from './components/VMChecker';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={
            <div className="App">
              <header className="App-header">
                <img src="/azsize-logo.png" alt="AZSize.com - Azure VM Size Checker" className="logo" />
                <p className="subtitle">Check VM availability and pricing across all Azure regions</p>
              </header>
              <main className="App-main">
                <VMChecker />
              </main>
              <footer className="App-footer">
                <p>Made with ❤️ for the Azure community | Not affiliated with Microsoft</p>
              </footer>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
