import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import VMChecker from './components/VMChecker';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import Header from './components/Header/Header';
import Blog from './components/Blog/Blog';
import BlogPost from './components/Blog/BlogPost';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/" element={
            <div className="App">
              <Header />
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
