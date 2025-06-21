import { useMap } from 'react-leaflet';
import './CustomZoomControls.css';

function CustomZoomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="custom-zoom-controls">
      <button
        className="zoom-btn zoom-in"
        onClick={handleZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        className="zoom-btn zoom-out"
        onClick={handleZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
}

export default CustomZoomControls;