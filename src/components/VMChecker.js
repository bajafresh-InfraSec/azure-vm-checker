import React, { useState } from 'react';
import './VMChecker.css';

const VMChecker = () => {
  const [location, setLocation] = useState('centralus');
  const [vmSeries, setVmSeries] = useState('Standard_D');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState({});

  const azureRegions = [
    // Americas
    { value: 'centralus', label: 'Central US' },
    { value: 'eastus', label: 'East US' },
    { value: 'eastus2', label: 'East US 2' },
    { value: 'westus', label: 'West US' },
    { value: 'westus2', label: 'West US 2' },
    { value: 'westus3', label: 'West US 3' },
    { value: 'northcentralus', label: 'North Central US' },
    { value: 'southcentralus', label: 'South Central US' },
    { value: 'westcentralus', label: 'West Central US' },
    { value: 'canadacentral', label: 'Canada Central' },
    { value: 'canadaeast', label: 'Canada East' },
    { value: 'brazilsouth', label: 'Brazil South' },
    { value: 'brazilsoutheast', label: 'Brazil Southeast' },
    // Europe
    { value: 'northeurope', label: 'North Europe' },
    { value: 'westeurope', label: 'West Europe' },
    { value: 'uksouth', label: 'UK South' },
    { value: 'ukwest', label: 'UK West' },
    { value: 'francecentral', label: 'France Central' },
    { value: 'francesouth', label: 'France South' },
    { value: 'germanywestcentral', label: 'Germany West Central' },
    { value: 'germanynorth', label: 'Germany North' },
    { value: 'norwayeast', label: 'Norway East' },
    { value: 'norwaywest', label: 'Norway West' },
    { value: 'switzerlandnorth', label: 'Switzerland North' },
    { value: 'switzerlandwest', label: 'Switzerland West' },
    { value: 'swedencentral', label: 'Sweden Central' },
    // Asia Pacific
    { value: 'eastasia', label: 'East Asia' },
    { value: 'southeastasia', label: 'Southeast Asia' },
    { value: 'japaneast', label: 'Japan East' },
    { value: 'japanwest', label: 'Japan West' },
    { value: 'australiaeast', label: 'Australia East' },
    { value: 'australiasoutheast', label: 'Australia Southeast' },
    { value: 'australiacentral', label: 'Australia Central' },
    { value: 'koreacentral', label: 'Korea Central' },
    { value: 'koreasouth', label: 'Korea South' },
    { value: 'centralindia', label: 'Central India' },
    { value: 'southindia', label: 'South India' },
    { value: 'westindia', label: 'West India' },
    // Middle East & Africa
    { value: 'uaenorth', label: 'UAE North' },
    { value: 'uaecentral', label: 'UAE Central' },
    { value: 'southafricanorth', label: 'South Africa North' },
    { value: 'southafricawest', label: 'South Africa West' },
  ];

  const vmSeriesList = [
    // General Purpose
    { value: 'Standard_A', label: 'A-series (Basic)' },
    { value: 'Standard_B', label: 'B-series (Burstable)' },
    { value: 'Standard_D', label: 'D-series (General Purpose)' },
    { value: 'Standard_DC', label: 'DC-series (Confidential Compute)' },
    { value: 'Standard_DD', label: 'DD-series (General Purpose with Local Disk)' },
    // Compute Optimized
    { value: 'Standard_F', label: 'F-series (Compute Optimized)' },
    // Memory Optimized
    { value: 'Standard_E', label: 'E-series (Memory Optimized)' },
    { value: 'Standard_ED', label: 'ED-series (Memory with Local Disk)' },
    { value: 'Standard_M', label: 'M-series (Large Memory)' },
    // Storage Optimized
    { value: 'Standard_L', label: 'L-series (Storage Optimized)' },
    // GPU
    { value: 'Standard_NC', label: 'NC-series (GPU - NVIDIA Tesla)' },
    { value: 'Standard_ND', label: 'ND-series (GPU - Deep Learning)' },
    { value: 'Standard_NV', label: 'NV-series (GPU - Visualization)' },
    // High Performance Compute
    { value: 'Standard_H', label: 'H-series (High Performance Compute)' },
    { value: 'Standard_HB', label: 'HB-series (HPC - Memory Bandwidth)' },
    { value: 'Standard_HC', label: 'HC-series (HPC - Compute Intensive)' },
  ];

  const checkAvailability = async () => {
    setLoading(true);
    setError(null);
    setHistoricalData({});

    try {
      // Call Azure Function API for current availability
      const response = await fetch(`/api/GetVMAvailability?location=${location}&series=${vmSeries}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);

      // Fetch historical data for each VM (in parallel)
      const historicalPromises = data.vms.slice(0, 10).map(vm =>
        fetch(`/api/GetHistoricalData?vmSize=${vm.name}&region=${location}&type=percentage&days=7`)
          .then(res => res.ok ? res.json() : null)
          .then(histData => ({
            vmName: vm.name,
            data: histData
          }))
          .catch(() => ({ vmName: vm.name, data: null }))
      );

      const historical = await Promise.all(historicalPromises);
      const historicalMap = {};
      historical.forEach(item => {
        if (item.data && item.data.data) {
          historicalMap[item.vmName] = item.data.data;
        }
      });
      setHistoricalData(historicalMap);

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
            {results.vms.map(vm => {
              const historical = historicalData[vm.name];
              const hasHistorical = historical && historical.total_checks > 0;
              const availabilityPct = hasHistorical ? historical.availability_pct : null;

              return (
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
                    {hasHistorical && (
                      <div className="spec historical-data">
                        <span className="spec-label">Last 7 days:</span>
                        <span className="spec-value">
                          {availabilityPct !== null ? `${availabilityPct.toFixed(1)}% available` : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VMChecker;
