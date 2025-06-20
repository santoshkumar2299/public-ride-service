import { handleCoordinatePaste } from '../utils/coordinateUtils';

function CoordinateInput({ 
  latValue, 
  lngValue, 
  onLatChange, 
  onLngChange, 
  latName, 
  lngName, 
  latLabel, 
  lngLabel, 
  latPlaceholder, 
  lngPlaceholder,
  required = false,
  onCoordinateUpdate // Optional: for handling both coordinates at once
}) {
  const handlePaste = (event, field) => {
    const updateCoordinates = (coordinates) => {
      // If a combined update function is provided, use it
      if (onCoordinateUpdate) {
        onCoordinateUpdate(latName, coordinates.lat, lngName, coordinates.lng);
      } else {
        // Create synthetic events that match the expected format
        const latEvent = { target: { name: latName, value: coordinates.lat } };
        const lngEvent = { target: { name: lngName, value: coordinates.lng } };
        
        // Call both updates
        onLatChange(latEvent);
        onLngChange(lngEvent);
      }
    };

    const wasHandled = handleCoordinatePaste(event, latValue, lngValue, updateCoordinates);
    if (!wasHandled) {
      // Let the normal paste behavior continue if coordinates weren't detected
      return;
    }
  };

  return (
    <div className="form-row">
      <div className="form-group">
        <label htmlFor={latName}>{latLabel}:</label>
        <input
          type="number"
          step="any"
          id={latName}
          name={latName}
          value={latValue}
          onChange={onLatChange}
          onPaste={(e) => handlePaste(e, 'lat')}
          placeholder={latPlaceholder}
          required={required}
          title="Tip: You can paste 'lat,lng' coordinates here and they'll be auto-split"
        />
      </div>
      <div className="form-group">
        <label htmlFor={lngName}>{lngLabel}:</label>
        <input
          type="number"
          step="any"
          id={lngName}
          name={lngName}
          value={lngValue}
          onChange={onLngChange}
          onPaste={(e) => handlePaste(e, 'lng')}
          placeholder={lngPlaceholder}
          required={required}
          title="Tip: You can paste 'lat,lng' coordinates here and they'll be auto-split"
        />
      </div>
    </div>
  );
}

export default CoordinateInput;