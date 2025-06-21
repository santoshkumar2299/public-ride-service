import { useState, useEffect } from 'react';
import { useTransport } from '../contexts/TransportContext';
import './BusReportingInterface.css';

const BusReportingInterface = ({ user, currentLocation, onClose, onReport }) => {
  const { routes } = useTransport();
  
  const [reportType, setReportType] = useState('spot'); // 'spot' or 'traveling'
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [busNumber, setBusNumber] = useState('');
  const [confidence, setConfidence] = useState('high');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: bus details, 3: confirmation

  // Handle report type selection
  const handleTypeSelection = (type) => {
    setReportType(type);
    setStep(2);
  };

  // Handle bus number input with auto-suggestions
  const getSuggestedRoutes = () => {
    if (!busNumber) return [];
    return routes.filter(route => 
      route.route_number.toLowerCase().includes(busNumber.toLowerCase())
    ).slice(0, 5);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!busNumber || !currentLocation) return;

    setIsSubmitting(true);
    try {
      const reportData = {
        type: reportType,
        bus_number: busNumber,
        route_id: selectedRoute?.id,
        location: currentLocation,
        confidence: confidence,
        additional_info: additionalInfo,
        user_id: user.id,
        timestamp: new Date().toISOString()
      };

      await onReport(reportData);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Report Type Selection
  if (step === 1) {
    return (
      <div className="bus-reporting-interface">
        <div className="reporting-header">
          <h3>📍 Report Bus Location</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="report-type-selection">
          <h4>What would you like to report?</h4>
          
          <div className="report-options">
            <button 
              className="report-option spot"
              onClick={() => handleTypeSelection('spot')}
            >
              <div className="option-icon">👀</div>
              <div className="option-content">
                <h5>I Saw a Bus</h5>
                <p>Report a bus you spotted at a stop or on the road</p>
                <span className="option-meta">📍 One-time location report</span>
              </div>
            </button>

            <button 
              className="report-option traveling"
              onClick={() => handleTypeSelection('traveling')}
            >
              <div className="option-icon">🚌</div>
              <div className="option-content">
                <h5>I'm Traveling</h5>
                <p>Share live location while traveling in this bus</p>
                <span className="option-meta">📡 Continuous tracking</span>
              </div>
            </button>
          </div>

          <div className="location-info">
            <span className="location-icon">📍</span>
            <span>Current location will be used for the report</span>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Bus Details
  if (step === 2) {
    const suggestedRoutes = getSuggestedRoutes();

    return (
      <div className="bus-reporting-interface">
        <div className="reporting-header">
          <button className="back-btn" onClick={() => setStep(1)}>←</button>
          <h3>
            {reportType === 'spot' ? '👀 Bus Spotted' : '🚌 Traveling in Bus'}
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="bus-details-form">
          <div className="form-group">
            <label>Bus Number *</label>
            <input
              type="text"
              placeholder="e.g., 185G, 102, 49M"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
              className="bus-number-input"
            />
            
            {suggestedRoutes.length > 0 && (
              <div className="route-suggestions">
                <span className="suggestions-label">Suggested routes:</span>
                {suggestedRoutes.map(route => (
                  <button
                    key={route.id}
                    className={`route-suggestion ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRoute(route);
                      setBusNumber(route.route_number);
                    }}
                  >
                    <span className="route-number">{route.route_number}</span>
                    <span className="route-path">{route.start_point} → {route.end_point}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confidence Level</label>
            <div className="confidence-options">
              <button
                className={`confidence-btn ${confidence === 'high' ? 'selected' : ''}`}
                onClick={() => setConfidence('high')}
              >
                💯 Very Sure
              </button>
              <button
                className={`confidence-btn ${confidence === 'medium' ? 'selected' : ''}`}
                onClick={() => setConfidence('medium')}
              >
                😐 Somewhat Sure
              </button>
              <button
                className={`confidence-btn ${confidence === 'low' ? 'selected' : ''}`}
                onClick={() => setConfidence('low')}
              >
                🤔 Not Sure
              </button>
            </div>
          </div>

          {reportType === 'traveling' && (
            <div className="traveling-notice">
              <div className="notice-content">
                <span className="notice-icon">⚠️</span>
                <div>
                  <strong>Live Tracking Notice</strong>
                  <p>Your location will be shared continuously while you're traveling to help other passengers.</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Additional Information (Optional)</label>
            <textarea
              placeholder={
                reportType === 'spot' 
                  ? "e.g., Bus was at Jubilee Hills Check Post, heading towards HITEC City"
                  : "e.g., Bus is currently full, next stop is Madhapur"
              }
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="additional-info"
            />
          </div>

          <div className="form-actions">
            <button 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!busNumber || isSubmitting}
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <span>
                  {reportType === 'spot' ? '📍 Report Bus Location' : '🚌 Start Live Tracking'}
                </span>
              )}
            </button>
          </div>

          <div className="report-summary">
            <h5>Report Summary:</h5>
            <div className="summary-item">
              <span>Type:</span> 
              <span>{reportType === 'spot' ? 'Bus Spotted' : 'Live Tracking'}</span>
            </div>
            <div className="summary-item">
              <span>Bus:</span> 
              <span>{busNumber || 'Not selected'}</span>
            </div>
            {selectedRoute && (
              <div className="summary-item">
                <span>Route:</span> 
                <span>{selectedRoute.route_name}</span>
              </div>
            )}
            <div className="summary-item">
              <span>Confidence:</span> 
              <span className={`confidence-${confidence}`}>
                {confidence === 'high' ? '💯 Very Sure' : confidence === 'medium' ? '😐 Somewhat Sure' : '🤔 Not Sure'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BusReportingInterface;