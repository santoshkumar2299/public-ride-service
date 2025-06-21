import { useTransport } from '../contexts/TransportContext';
import './TransportModeSelector.css';

const TransportModeSelector = ({ onModeChange }) => {
  const { 
    transportTypes, 
    selectedTransportType, 
    selectTransportType, 
    loading, 
    error,
    getTransportIcon 
  } = useTransport();

  const handleTransportSelect = (transportType) => {
    selectTransportType(transportType);
    if (onModeChange) {
      onModeChange(transportType);
    }
  };

  const addRideSharingOption = () => {
    const rideSharingMode = {
      id: 'ride-sharing',
      name: 'Ride Sharing',
      icon: '🚗',
      description: 'Share rides with other passengers'
    };
    return [rideSharingMode, ...transportTypes];
  };

  const allTransportOptions = addRideSharingOption();

  if (loading) {
    return (
      <div className="transport-mode-selector">
        <h3>Choose Transport Mode</h3>
        <div className="transport-options loading">
          <div className="transport-option skeleton">
            <div className="transport-icon skeleton-circle"></div>
            <div className="transport-name skeleton-text"></div>
          </div>
          <div className="transport-option skeleton">
            <div className="transport-icon skeleton-circle"></div>
            <div className="transport-name skeleton-text"></div>
          </div>
          <div className="transport-option skeleton">
            <div className="transport-icon skeleton-circle"></div>
            <div className="transport-name skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transport-mode-selector">
        <h3>Choose Transport Mode</h3>
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="transport-mode-selector">
      <h3>Choose Transport Mode</h3>
      <div className="transport-options">
        {allTransportOptions.map((transport) => (
          <button
            key={transport.id}
            className={`transport-option ${
              selectedTransportType?.id === transport.id ? 'selected' : ''
            }`}
            onClick={() => handleTransportSelect(transport)}
          >
            <div className="transport-icon">
              {transport.icon || getTransportIcon(transport.name)}
            </div>
            <div className="transport-info">
              <div className="transport-name">{transport.name}</div>
              <div className="transport-description">
                {transport.description}
              </div>
            </div>
            {selectedTransportType?.id === transport.id && (
              <div className="selected-indicator">✓</div>
            )}
          </button>
        ))}
      </div>
      
      {selectedTransportType && (
        <div className="selected-transport-info">
          <h4>
            {selectedTransportType.icon || getTransportIcon(selectedTransportType.name)} 
            {selectedTransportType.name} Selected
          </h4>
          <p>{selectedTransportType.description}</p>
        </div>
      )}
    </div>
  );
};

export default TransportModeSelector;