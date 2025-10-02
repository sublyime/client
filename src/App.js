import React, { useState, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import ControlPanel from './components/ControlPanel';
import ReceptorPanel from './components/ReceptorPanel';
import WebSocketService from './services/WebSocketService';
import './App.css';

function App() {
  const [activeRelease, setActiveRelease] = useState(null);
  const [releases, setReleases] = useState([]);
  const [receptors, setReceptors] = useState([]);
  const [currentPlume, setCurrentPlume] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [clickedLocation, setClickedLocation] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocketService('ws://localhost:3001');
    setWebsocket(ws);

    // Subscribe to real-time updates
    ws.onMessage((data) => {
      if (data.type === 'plume_update') {
        // Refresh plume data
        if (activeRelease) {
          fetchPlumeData(activeRelease.id);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      ws.disconnect();
    };
  }, [activeRelease]);

  const fetchPlumeData = async (releaseId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/dispersion/release/${releaseId}`);
      const plumeData = await response.json();
      setCurrentPlume(plumeData);
    } catch (error) {
      console.error('Error fetching plume data:', error);
    }
  };

  const handleMapClick = (lat, lng) => {
    // Pass the clicked location to ControlPanel
    setClickedLocation({ lat, lng });
    console.log('Map clicked at:', lat, lng);
  };

  const handleReleaseCreated = (release) => {
    setActiveRelease(release);
    setReleases(prev => [release, ...prev]);
    
    // Subscribe to updates for this release
    if (websocket) {
      websocket.subscribe('releases');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>ChemDispersion - Chemical Dispersion Modeling</h1>
        <div className="status-indicators">
          <span className={`status ${websocket?.connected ? 'connected' : 'disconnected'}`}>
            {websocket?.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>
      
      <div className="app-content">
        <div className="left-panel">
          <ControlPanel 
            onReleaseCreated={handleReleaseCreated}
            activeRelease={activeRelease}
            onReleaseSelect={setActiveRelease}
            releases={releases}
            clickedLocation={clickedLocation}
            setClickedLocation={setClickedLocation}
          />
          <ReceptorPanel 
            receptors={receptors}
            setReceptors={setReceptors}
            activeRelease={activeRelease}
          />
        </div>
        
        <div className="map-container">
          <MapContainer 
            onMapClick={handleMapClick}
            activeRelease={activeRelease}
            currentPlume={currentPlume}
            receptors={receptors}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
