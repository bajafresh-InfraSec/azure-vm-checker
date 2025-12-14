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
      // Mock data for MVP (no API needed!)
      const mockData = generateMockData(location, vmSeries);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setResults({
        location: location,
        series: vmSeries,
        vms: mockData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to fetch VM availability. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generator
  const generateMockData = (loc, series) => {
    const allVMs = {
      'Standard_B': [
        { name: 'Standard_B1s', vCPUs: 1, memoryGB: 1, available: true, pricePerMonth: 8 },
        { name: 'Standard_B2s', vCPUs: 2, memoryGB: 4, available: true, pricePerMonth: 30 },
        { name: 'Standard_B2ms', vCPUs: 2, memoryGB: 8, available: false, pricePerMonth: 60 },
        { name: 'Standard_B4ms', vCPUs: 4, memoryGB: 16, available: true, pricePerMonth: 120 }
      ],
      'Standard_D': [
        { name: 'Standard_D2s_v3', vCPUs: 2, memoryGB: 8, available: false, pricePerMonth: 70 },
        { name: 'Standard_D2s_v4', vCPUs: 2, memoryGB: 8, available: true, pricePerMonth: 70 },
        { name: 'Standard_D2s_v5', vCPUs: 2, memoryGB: 8, available: false, pricePerMonth: 68 },
        { name: 'Standard_D4s_v3', vCPUs: 4, memoryGB: 16, available: true, pricePerMonth: 140 },
        { name: 'Standard_D4s_v4', vCPUs: 4, memoryGB: 16, available: true, pricePerMonth: 140 },
        { name: 'Standard_D8s_v4', vCPUs: 8, memoryGB: 32, available: true, pricePerMonth: 280 }
      ],
      'Standard_E': [
        { name: 'Standard_E2s_v3', vCPUs: 2, memoryGB: 16, available: true, pricePerMonth: 120 },
        { name: 'Standard_E2s_v4', vCPUs: 2, memoryGB: 16, available: true, pricePerMonth: 120 },
        { name: 'Standard_E4s_v3', vCPUs: 4, memoryGB: 32, available: true, pricePerMonth: 240 },
        { name: 'Standard_E4s_v4', vCPUs: 4, memoryGB: 32, available: false, pricePerMonth: 240 },
        { name: 'Standard_E8s_v4', vCPUs: 8, memoryGB: 64, available: true, pricePerMonth: 480 }
      ],
      'Standard_F': [
        { name: 'Standard_F2s_v2', vCPUs: 2, memoryGB: 4, available: true, pricePerMonth: 68 },
        { name: 'Standard_F4s_v2', vCPUs: 4, memoryGB: 8, available: true, pricePerMonth: 136 },
        { name: 'Standard_F8s_v2', vCPUs: 8, memoryGB: 16, available: true, pricePerMonth: 272 },
        { name: 'Standard_F16s_v2', vCPUs: 16, memoryGB: 32, available: false, pricePerMonth: 544 }
      ]
    };

    return allVMs[series] || [];
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
