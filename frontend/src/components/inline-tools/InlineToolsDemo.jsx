import { useState } from 'react';
import ExpandableBottomBar from './ExpandableBottomBar';
import FloatingCard from './FloatingCard';
import SlideUpPanel from './SlideUpPanel';
import './InlineToolsDemo.css';

function InlineToolsDemo({ userLocation }) {
  const [currentDemo, setCurrentDemo] = useState('bottom-bar'); // 'bottom-bar', 'floating-card', 'slide-panel', 'none'
  const [showSlidePanel, setShowSlidePanel] = useState(false);

  const handleDemoChange = (demoType) => {
    // Close any open panels first
    setShowSlidePanel(false);
    
    // Set new demo type
    setCurrentDemo(demoType);
    
    // If slide panel, show it
    if (demoType === 'slide-panel') {
      setTimeout(() => setShowSlidePanel(true), 100);
    }
  };

  const handleCloseDemo = () => {
    setCurrentDemo('none');
    setShowSlidePanel(false);
  };

  const handleCloseSlidePanel = () => {
    setShowSlidePanel(false);
    setCurrentDemo('none');
  };

  return (
    <>
      {/* Demo Control Panel */}
      <div className="demo-controls">
        <div className="demo-header">
          <h3>🧪 Inline Tools POC</h3>
          <p>Compare different UX patterns</p>
        </div>
        
        <div className="demo-buttons">
          <button 
            className={`demo-btn ${currentDemo === 'bottom-bar' ? 'active' : ''}`}
            onClick={() => handleDemoChange('bottom-bar')}
          >
            📱 Bottom Bar
            <span className="demo-desc">Google Maps style</span>
          </button>
          
          <button 
            className={`demo-btn ${currentDemo === 'floating-card' ? 'active' : ''}`}
            onClick={() => handleDemoChange('floating-card')}
          >
            🎈 Floating Card
            <span className="demo-desc">Uber style</span>
          </button>
          
          <button 
            className={`demo-btn ${currentDemo === 'slide-panel' ? 'active' : ''}`}
            onClick={() => handleDemoChange('slide-panel')}
          >
            📋 Slide Panel
            <span className="demo-desc">iOS Control Center</span>
          </button>
          
          <button 
            className={`demo-btn ${currentDemo === 'none' ? 'active' : ''}`}
            onClick={() => handleDemoChange('none')}
          >
            ❌ None
            <span className="demo-desc">Clear all</span>
          </button>
        </div>

        {/* Pattern Comparison */}
        <div className="pattern-info">
          {currentDemo === 'bottom-bar' && (
            <div className="pattern-details">
              <strong>Expandable Bottom Bar</strong>
              <ul>
                <li>✅ Always visible hint</li>
                <li>✅ Doesn't block map</li>
                <li>✅ Mobile-friendly</li>
                <li>⚠️ Limited space when collapsed</li>
              </ul>
            </div>
          )}
          
          {currentDemo === 'floating-card' && (
            <div className="pattern-details">
              <strong>Floating Card</strong>
              <ul>
                <li>✅ Quick access</li>
                <li>✅ Expandable for details</li>
                <li>✅ Familiar (Uber-like)</li>
                <li>⚠️ Can cover map content</li>
              </ul>
            </div>
          )}
          
          {currentDemo === 'slide-panel' && (
            <div className="pattern-details">
              <strong>Slide Up Panel</strong>
              <ul>
                <li>✅ Full form space</li>
                <li>✅ iOS-familiar gesture</li>
                <li>✅ Rich interactions</li>
                <li>⚠️ Covers more screen area</li>
              </ul>
            </div>
          )}
          
          {currentDemo === 'none' && (
            <div className="pattern-details">
              <strong>No Inline Tools</strong>
              <p>Clean map view - use FAB → Modal for reporting</p>
            </div>
          )}
        </div>
      </div>

      {/* Render Active Demo */}
      {currentDemo === 'bottom-bar' && (
        <ExpandableBottomBar 
          userLocation={userLocation}
          onClose={handleCloseDemo}
        />
      )}
      
      {currentDemo === 'floating-card' && (
        <FloatingCard 
          userLocation={userLocation}
          onClose={handleCloseDemo}
        />
      )}
      
      {currentDemo === 'slide-panel' && (
        <SlideUpPanel 
          userLocation={userLocation}
          onClose={handleCloseSlidePanel}
          isVisible={showSlidePanel}
        />
      )}
    </>
  );
}

export default InlineToolsDemo;