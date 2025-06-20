export const parseCoordinates = (pastedValue) => {
  if (!pastedValue || typeof pastedValue !== 'string') {
    return null;
  }

  const trimmed = pastedValue.trim();
  
  if (!trimmed.includes(',')) {
    return null;
  }

  const parts = trimmed.split(',').map(part => part.trim());
  
  if (parts.length !== 2) {
    return null;
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat: lat.toString(),
    lng: lng.toString()
  };
};

export const handleCoordinatePaste = (event, currentLatValue, currentLngValue, updateFunction) => {
  const pastedText = event.clipboardData.getData('text');
  const coordinates = parseCoordinates(pastedText);
  
  if (coordinates) {
    event.preventDefault();
    updateFunction(coordinates);
    return true;
  }
  
  return false;
};