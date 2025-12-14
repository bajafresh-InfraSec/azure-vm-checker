import React, { useState } from 'react';
import './VMChecker.css';
import axios from 'axios';

const VMChecker = () => {
  const [location, setLocation] = useState('centralus');
  const [vmSeries, setVmSeries] = useState('Standard_D');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const azureRegions = [
    { value: 'centralus', label: 'Central US' },
    { value: 'eastus', label: 'East US' },
    { value: 'eastus2', label: 'East US 2' },
    { value: 'westus', label: 'West US' },
    { value: 'westus2', label: 'West US 2' },
    { value: 'westus3', label: 'West US 3' },
    { value: 'northcentralus', label: 'North Central US' },
    { value: 'southcentralus', label: 'South Central US' },
    { value: 'westcentralus', label: 'West Central US' },
  ];

  const vmSeriesList = [
    { value: 'Standard_B', label: 'B-series (Burstable)' },
    { value: 'Standard_D', label: 'D-series (General Purpose)' },
    { value: 'Standard_E', label: 'E-series (Memory Optimized)' },
    { value: 'Standard_F', label: 'F-series (Compute Optimized)' },
  ];

  const checkAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      // For local development, use localhost
      // For production, this will use the deployed API
      const apiUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:7071/api/vm-availability'
        : '/api/vm-availability';

      const response = await axios.get(apiUrl, {
        params: { location, series: vmSeries }
      });

      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch VM availability. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vm-checker">
      <div className="search-panel">
        <h2>Check VM Availability</h2>

        <div className="form-group">
          <label>Azure Region</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="form-control"
          >
            {azureRegions.map(region => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>VM Series</label>
          <select
            value={vmSeries}
            onChange={(e) => setVmSeries(e.target.value)}
            className="form-control"
          >
            {vmSeriesList.map(series => (
              <option key={series.value} value={series.value}>
                {series.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={checkAvailability}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {results && (
        <div className="results-panel">
          <h3>Results for {results.location}</h3>
          <p className="results-meta">Last updated: {new Date(results.timestamp).toLocaleString()}</p>

          <div className="vm-grid">
            {results.vms.map(vm => (
              <div key={vm.name} className={`vm-card ${vm.available ? 'available' : 'unavailable'}`}>
                <div className="vm-header">
                  <h4>{vm.name}</h4>
                  <span className={`status-badge ${vm.available ? 'available' : 'unavailable'}`}>
                    {vm.available ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </div>
                <div className="vm-specs">
                  <div className="spec">
                    <span className="spec-label">vCPUs:</span>
                    <span className="spec-value">{vm.vCPUs}</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Memory:</span>
                    <span className="spec-value">{vm.memoryGB} GB</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Est. Price:</span>
                    <span className="spec-value">${vm.pricePerMonth}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VMChecker;
