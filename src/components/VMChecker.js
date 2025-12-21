import React, { useState, useEffect } from 'react';
import './VMChecker.css';
import { useAuth } from '../context/AuthContext';
import { checkAnonymousLimit, incrementAnonymousUsage } from '../utils/anonymousRateLimit';
import SignupModal from './Auth/SignupModal';
import { useNavigate } from 'react-router-dom';

const VMChecker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'https://www.azsize.com';

  // Parse URL parameters on mount
  const urlParams = new URLSearchParams(window.location.search);
  const initialLocation = urlParams.get('region') || 'centralus';
  const initialSeries = urlParams.get('series') || 'Standard_D';
  const initialCompareMode = urlParams.get('compare') === 'true';
  const initialRegions = urlParams.get('regions') ? urlParams.get('regions').split(',') : ['centralus'];
  const hasUrlParams = urlParams.get('region') || urlParams.get('regions');

  const [location, setLocation] = useState(initialLocation);
  const [vmSeries, setVmSeries] = useState(initialSeries);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [compareMode, setCompareMode] = useState(initialCompareMode);
  const [selectedRegions, setSelectedRegions] = useState(initialRegions);
  const [compareResults, setCompareResults] = useState({});
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Auto-check on mount if URL has parameters
  useEffect(() => {
    if (hasUrlParams && !autoLoaded) {
      setAutoLoaded(true);
      // Trigger check after component mounts
      const timer = setTimeout(() => {
        checkAvailability();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrlParams, autoLoaded]);

  // Update URL when parameters change
  const updateURL = () => {
    const params = new URLSearchParams();
    if (compareMode) {
      params.set('compare', 'true');
      params.set('regions', selectedRegions.join(','));
    } else {
      params.set('region', location);
    }
    params.set('series', vmSeries);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
  };

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

  const exportToCSV = () => {
    if (!results) return;

    // Create CSV content
    const headers = ['VM Size', 'vCPUs', 'Memory (GB)', 'Available', 'Price/Month', 'Restrictions'];
    const rows = results.vms.map(vm => [
      vm.name,
      vm.vCPUs,
      vm.memoryGB,
      vm.available ? 'Yes' : 'No',
      `$${vm.pricePerMonth}`,
      vm.restrictions ? vm.restrictions.join(', ') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `azure-vm-availability-${results.location}-${results.series}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const shareCurrentSearch = () => {
    const currentURL = window.location.href;
    navigator.clipboard.writeText(currentURL).then(() => {
      alert('Link copied to clipboard! Share this URL to show these exact results.');
    }).catch(() => {
      // Fallback for browsers without clipboard API
      prompt('Copy this URL to share:', currentURL);
    });
  };

  const checkAvailability = async () => {
    // Check if user is authenticated
    if (!user) {
      const limit = checkAnonymousLimit();
      if (!limit.allowed) {
        setShowSignupModal(true);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setHistoricalData({});
    updateURL(); // Update URL with current search parameters

    try {
      if (compareMode) {
        // Compare mode: fetch data for multiple regions
        const comparePromises = selectedRegions.map(region =>
          fetch(`${API_URL}/api/GetVMAvailability?location=${region}&series=${vmSeries}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => ({ region, data }))
            .catch(() => ({ region, data: null }))
        );

        const compareData = await Promise.all(comparePromises);
        const compareMap = {};
        compareData.forEach(item => {
          if (item.data) {
            compareMap[item.region] = item.data;
          }
        });
        setCompareResults(compareMap);
        setResults(null);

      } else {
        // Single region mode
        const response = await fetch(`${API_URL}/api/GetVMAvailability?location=${location}&series=${vmSeries}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResults(data);
        setCompareResults({});

        // Fetch historical data for each VM (in parallel)
        const historicalPromises = data.vms.slice(0, 10).map(vm =>
          fetch(`${API_URL}/api/GetHistoricalData?vmSize=${vm.name}&region=${location}&type=percentage&days=7`)
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
      }

      // Increment anonymous usage if not authenticated
      if (!user) {
        incrementAnonymousUsage();
      }

    } catch (err) {
      setError('Failed to fetch VM availability. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRegion = (region) => {
    if (selectedRegions.includes(region)) {
      if (selectedRegions.length > 1) {
        setSelectedRegions(selectedRegions.filter(r => r !== region));
      }
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  return (
    <div className="vm-checker">
      <div className="search-panel">
        <div className="cli-banner">
          <span className="cli-icon">⚡</span>
          <span className="cli-text">
            New: CLI now available! Install with <code>npm install -g azsize</code>
          </span>
          <a href="https://www.npmjs.com/package/azsize" target="_blank" rel="noopener noreferrer" className="cli-link">
            Learn more →
          </a>
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">Compare Multiple Regions</span>
          </label>
        </div>

        {!compareMode ? (
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
        ) : (
          <div className="form-group">
            <label>Select Regions to Compare ({selectedRegions.length} selected)</label>
            <div className="region-pills">
              {azureRegions.map(region => (
                <button
                  key={region.value}
                  onClick={() => toggleRegion(region.value)}
                  className={`region-pill ${selectedRegions.includes(region.value) ? 'selected' : ''}`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
          {loading ? 'Checking...' : compareMode ? 'Compare Regions' : 'Check Availability'}
        </button>
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>{compareMode ? `Checking ${selectedRegions.length} regions...` : 'Checking availability...'}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {compareMode && Object.keys(compareResults).length > 0 && (
        <div className="results-panel">
          <div className="results-header">
            <div>
              <h3>Region Comparison for {vmSeries}</h3>
              <p className="results-meta">Comparing {Object.keys(compareResults).length} regions</p>
            </div>
            <div className="header-actions">
              <button onClick={shareCurrentSearch} className="btn-share">
                🔗 Share
              </button>
            </div>
          </div>

          <div className="compare-grid">
            {Object.entries(compareResults).map(([region, data]) => (
              <div key={region} className="compare-region">
                <h4 className="region-name">
                  {azureRegions.find(r => r.value === region)?.label || region}
                </h4>
                <div className="compare-stats">
                  <div className="stat">
                    <span className="stat-label">Total VMs:</span>
                    <span className="stat-value">{data.vms.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available:</span>
                    <span className="stat-value available">{data.vms.filter(v => v.available).length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Unavailable:</span>
                    <span className="stat-value unavailable">{data.vms.filter(v => !v.available).length}</span>
                  </div>
                </div>
                <div className="vm-list-compact">
                  {data.vms.slice(0, 5).map(vm => (
                    <div key={vm.name} className="vm-item-compact">
                      <span className={`status-dot ${vm.available ? 'available' : 'unavailable'}`}></span>
                      <span className="vm-name-compact">{vm.name}</span>
                      <span className="vm-specs-compact">{vm.vCPUs}vCPU · {vm.memoryGB}GB</span>
                    </div>
                  ))}
                  {data.vms.length > 5 && (
                    <div className="vm-item-more">+ {data.vms.length - 5} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compareMode && results && (
        <div className="results-panel">
          <div className="results-header">
            <div>
              <h3>Results for {results.location}</h3>
              <p className="results-meta">Last updated: {new Date(results.timestamp).toLocaleString()}</p>
            </div>
            <div className="header-actions">
              <button onClick={shareCurrentSearch} className="btn-share">
                🔗 Share
              </button>
              <button onClick={exportToCSV} className="btn-export">
                📊 Export to CSV
              </button>
            </div>
          </div>

          <div className="vm-grid">
            {results.vms.map(vm => {
              const historical = historicalData[vm.name];
              const hasHistorical = historical && historical.total_checks > 0;
              const availabilityPct = hasHistorical ? historical.availability_pct : null;

              // Find alternatives if unavailable
              const alternatives = !vm.available
                ? results.vms.filter(v =>
                    v.available &&
                    v.vCPUs === vm.vCPUs &&
                    Math.abs(v.memoryGB - vm.memoryGB) <= 4
                  ).slice(0, 2)
                : [];

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
                  {alternatives.length > 0 && (
                    <div className="alternatives">
                      <div className="alternatives-header">💡 Try instead:</div>
                      {alternatives.map(alt => (
                        <div key={alt.name} className="alternative-item">
                          <span className="alt-name">{alt.name}</span>
                          <span className="alt-specs">
                            {alt.vCPUs} vCPUs, {alt.memoryGB}GB · ${alt.pricePerMonth}/mo
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="feedback-widget">
        <p>Have feedback or found a bug? <a href="mailto:feedback@azsize.com?subject=azsize.com Feedback" className="feedback-link">Let us know</a></p>
        <p style={{ marginTop: '10px', fontSize: '12px' }}>
          <a href="/privacy.html" target="_blank" className="feedback-link">Privacy Policy</a>
        </p>
      </div>

      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSignup={() => navigate('/signup')}
          onLogin={() => navigate('/login')}
        />
      )}
    </div>
  );
};

export default VMChecker;
