import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function ControlPanel({ onReleaseCreated, activeRelease, onReleaseSelect, releases, clickedLocation, setClickedLocation }) {
  const [chemicals, setChemicals] = useState([]);
  const [weatherStations, setWeatherStations] = useState([]);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Release form state
  const [releaseForm, setReleaseForm] = useState({
    event_name: '',
    chemical_id: '',
    latitude: '',
    longitude: '',
    release_rate: '',
    total_mass: '',
    release_temperature: '20',
    release_height: '0',
    release_type: 'continuous',
    release_state: 'gas',
    weather_station_id: ''
  });

  useEffect(() => {
    fetchChemicals();
    fetchWeatherStations();
    fetchReleases();
  }, []);

  // Handle clicked location from map
  useEffect(() => {
    if (clickedLocation) {
      setReleaseForm(prev => ({
        ...prev,
        latitude: clickedLocation.lat.toString(),
        longitude: clickedLocation.lng.toString()
      }));
      setShowReleaseForm(true);
      setClickedLocation(null); // Clear the clicked location
    }
  }, [clickedLocation, setClickedLocation]);

  const fetchChemicals = async () => {
    try {
      const response = await axios.get(`${API_BASE}/chemicals`);
      setChemicals(response.data);
    } catch (error) {
      console.error('Error fetching chemicals:', error);
    }
  };

  const fetchWeatherStations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/weather/stations`);
      setWeatherStations(response.data);
    } catch (error) {
      console.error('Error fetching weather stations:', error);
    }
  };

  const fetchReleases = async () => {
    try {
      await axios.get(`${API_BASE}/releases/active`);
      // Handle in parent component
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReleaseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitRelease = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert form data to proper types
      const releaseData = {
        ...releaseForm,
        chemical_id: parseInt(releaseForm.chemical_id),
        latitude: parseFloat(releaseForm.latitude),
        longitude: parseFloat(releaseForm.longitude),
        release_rate: parseFloat(releaseForm.release_rate),
        total_mass: parseFloat(releaseForm.total_mass),
        release_temperature: parseFloat(releaseForm.release_temperature),
        release_height: parseFloat(releaseForm.release_height),
        weather_station_id: parseInt(releaseForm.weather_station_id),
        release_start: new Date().toISOString(),
        created_by: 'user' // In a real app, this would be the authenticated user
      };

      const response = await axios.post(`${API_BASE}/releases`, releaseData);
      
      onReleaseCreated(response.data);
      setShowReleaseForm(false);
      setReleaseForm({
        event_name: '',
        chemical_id: '',
        latitude: '',
        longitude: '',
        release_rate: '',
        total_mass: '',
        release_temperature: '20',
        release_height: '0',
        release_type: 'continuous',
        release_state: 'gas',
        weather_station_id: ''
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create release');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRelease = async (releaseId) => {
    try {
      await axios.patch(`${API_BASE}/releases/${releaseId}/stop`);
      // Refresh releases
      fetchReleases();
    } catch (error) {
      setError('Failed to stop release');
    }
  };

  return (
    <div className="panel">
      <h3>Release Control</h3>
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Instructions */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <small>Click on the map to create a new chemical release at that location.</small>
      </div>

      {/* New Release Form */}
      {showReleaseForm && (
        <form onSubmit={handleSubmitRelease} style={{ marginBottom: '1rem' }}>
          <h4>New Chemical Release</h4>
          
          <div className="form-group">
            <label>Event Name</label>
            <input
              type="text"
              name="event_name"
              value={releaseForm.event_name}
              onChange={handleFormChange}
              placeholder="Emergency response event"
              required
            />
          </div>

          <div className="form-group">
            <label>Chemical</label>
            <select
              name="chemical_id"
              value={releaseForm.chemical_id}
              onChange={handleFormChange}
              required
            >
              <option value="">Select chemical...</option>
              {chemicals.map(chemical => (
                <option key={chemical.id} value={chemical.id}>
                  {chemical.name} ({chemical.state_at_stp})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={releaseForm.latitude}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={releaseForm.longitude}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Release Type</label>
            <select
              name="release_type"
              value={releaseForm.release_type}
              onChange={handleFormChange}
            >
              <option value="continuous">Continuous</option>
              <option value="instantaneous">Instantaneous</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          <div className="form-group">
            <label>Release State</label>
            <select
              name="release_state"
              value={releaseForm.release_state}
              onChange={handleFormChange}
            >
              <option value="gas">Gas</option>
              <option value="liquid">Liquid</option>
              <option value="fire">Fire</option>
              <option value="explosion">Explosion</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Release Rate (kg/s)</label>
              <input
                type="number"
                step="any"
                name="release_rate"
                value={releaseForm.release_rate}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Total Mass (kg)</label>
              <input
                type="number"
                step="any"
                name="total_mass"
                value={releaseForm.total_mass}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="any"
                name="release_temperature"
                value={releaseForm.release_temperature}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Height (m)</label>
              <input
                type="number"
                step="any"
                name="release_height"
                value={releaseForm.release_height}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Weather Station</label>
            <select
              name="weather_station_id"
              value={releaseForm.weather_station_id}
              onChange={handleFormChange}
              required
            >
              <option value="">Select weather station...</option>
              {weatherStations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.station_type})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Release'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowReleaseForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active Releases */}
      <div>
        <h4>Active Releases</h4>
        {releases.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No active releases</p>
        ) : (
          releases.map(release => (
            <div 
              key={release.id} 
              className={`release-item ${activeRelease?.id === release.id ? 'active' : ''}`}
              onClick={() => onReleaseSelect(release)}
            >
              <h4>{release.event_name || `Release ${release.id}`}</h4>
              <p><strong>Chemical:</strong> {release.chemical_name}</p>
              <p><strong>State:</strong> {release.release_state}</p>
              <p><strong>Rate:</strong> {release.release_rate} kg/s</p>
              <p><strong>Started:</strong> {new Date(release.release_start).toLocaleString()}</p>
              
              {release.is_active && (
                <button
                  className="btn btn-danger"
                  style={{ marginTop: '0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopRelease(release.id);
                  }}
                >
                  Stop Release
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Add Chemical Button */}
      <div style={{ marginTop: '1rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowReleaseForm(true)}
        >
          Add Release Manually
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;