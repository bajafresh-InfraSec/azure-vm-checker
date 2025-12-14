import React, { useState } from 'react';
import './App.css';
import VMChecker from './components/VMChecker';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Azure VM Size Checker</h1>
        <p className="subtitle">Check VM availability and pricing across all Azure regions</p>
      </header>
      <main className="App-main">
        <VMChecker />
      </main>
      <footer className="App-footer">
        <p>Made with ❤️ for the Azure community | Not affiliated with Microsoft</p>
      </footer>
    </div>
  );
}

export default App;
