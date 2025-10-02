import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function ReceptorPanel({ receptors, setReceptors, activeRelease }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [receptorImpacts, setReceptorImpacts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newReceptor, setNewReceptor] = useState({
    name: '',
    latitude: '',
    longitude: '',
    elevation: '0',
    receptor_type: 'residential',
    population: '',
    sensitivity_factor: '1.0'
  });

  useEffect(() => {
    fetchReceptors();
  }, []);

  useEffect(() => {
    if (activeRelease) {
      fetchReceptorImpacts();
    }
  }, [activeRelease]);

  const fetchReceptors = async () => {
    try {
      const response = await axios.get(`${API_BASE}/receptors`);
      setReceptors(response.data);
    } catch (error) {
      console.error('Error fetching receptors:', error);
    }
  };

  const fetchReceptorImpacts = async () => {
    if (!activeRelease?.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/receptors/release/${activeRelease.id}/impacts`);
      setReceptorImpacts(response.data);
    } catch (error) {
      console.error('Error fetching receptor impacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReceptor = async (e) => {
    e.preventDefault();
    try {
      const receptorData = {
        ...newReceptor,
        latitude: parseFloat(newReceptor.latitude),
        longitude: parseFloat(newReceptor.longitude),
        elevation: parseFloat(newReceptor.elevation),
        population: newReceptor.population ? parseInt(newReceptor.population) : null,
        sensitivity_factor: parseFloat(newReceptor.sensitivity_factor)
      };

      const response = await axios.post(`${API_BASE}/receptors`, receptorData);
      setReceptors(prev => [...prev, response.data]);
      setShowAddForm(false);
      setNewReceptor({
        name: '',
        latitude: '',
        longitude: '',
        elevation: '0',
        receptor_type: 'residential',
        population: '',
        sensitivity_factor: '1.0'
      });
    } catch (error) {
      console.error('Error adding receptor:', error);
    }
  };

  const getReceptorImpact = (receptorId) => {
    return receptorImpacts.find(impact => impact.receptor_id === receptorId);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'extreme': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'moderate': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="panel">
      <h3>Receptors & Impacts</h3>

      {/* Add Receptor Form */}
      {showAddForm && (
        <form onSubmit={handleAddReceptor} style={{ marginBottom: '1rem' }}>
          <h4>Add Receptor</h4>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newReceptor.name}
              onChange={(e) => setNewReceptor({...newReceptor, name: e.target.value})}
              placeholder="School, Hospital, etc."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={newReceptor.latitude}
                onChange={(e) => setNewReceptor({...newReceptor, latitude: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={newReceptor.longitude}
                onChange={(e) => setNewReceptor({...newReceptor, longitude: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={newReceptor.receptor_type}
              onChange={(e) => setNewReceptor({...newReceptor, receptor_type: e.target.value})}
            >
              <option value="residential">Residential</option>
              <option value="school">School</option>
              <option value="hospital">Hospital</option>
              <option value="industrial">Industrial</option>
              <option value="commercial">Commercial</option>
              <option value="environmental">Environmental</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="form-group">
              <label>Population</label>
              <input
                type="number"
                value={newReceptor.population}
                onChange={(e) => setNewReceptor({...newReceptor, population: e.target.value})}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Sensitivity</label>
              <input
                type="number"
                step="0.1"
                value={newReceptor.sensitivity_factor}
                onChange={(e) => setNewReceptor({...newReceptor, sensitivity_factor: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">Add Receptor</button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Receptor List */}
      <div>
        {loading ? (
          <div className="loading">Loading impacts...</div>
        ) : (
          receptors.map(receptor => {
            const impact = getReceptorImpact(receptor.id);
            return (
              <div key={receptor.id} className="receptor-item">
                <div className="receptor-info">
                  <h5>{receptor.name}</h5>
                  <p>{receptor.receptor_type}</p>
                  <p>{receptor.latitude.toFixed(4)}, {receptor.longitude.toFixed(4)}</p>
                  {receptor.population && <p>Pop: {receptor.population}</p>}
                </div>
                
                {impact && (
                  <div className="concentration-display">
                    <div 
                      className="concentration-value"
                      style={{ color: getRiskColor(impact.risk_level) }}
                    >
                      {impact.concentration.toFixed(3)} mg/m³
                    </div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      {impact.risk_level} Risk
                    </div>
                    {impact.arrival_time && (
                      <div style={{ fontSize: '0.7rem' }}>
                        Arrival: {new Date(impact.arrival_time).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Receptor Button */}
      <button 
        className="btn btn-primary"
        onClick={() => setShowAddForm(true)}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        Add Receptor
      </button>

      {/* Impact Summary */}
      {activeRelease && receptorImpacts.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h5>Impact Summary</h5>
          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
            <strong>Receptors Affected:</strong> {receptorImpacts.length}
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
            <strong>Max Concentration:</strong> {Math.max(...receptorImpacts.map(i => i.concentration)).toFixed(3)} mg/m³
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
            <strong>High Risk Receptors:</strong> {receptorImpacts.filter(i => i.risk_level === 'high' || i.risk_level === 'extreme').length}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReceptorPanel;