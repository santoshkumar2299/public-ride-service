import { useState, useEffect, useRef } from 'react'
import './App.css'
import Login from './components/Login'
import Header from './components/Header'
import LiveCityMap from './components/LiveCityMap'
import RiderFlow from './components/RiderFlow'
import PassengerFlow from './components/PassengerFlow'
import RideHistory from './components/RideHistory'
import ActiveRides from './components/ActiveRides'
import Profile from './components/Profile'
import UserContributionHistory from './components/UserContributionHistory'
import LoadingSkeleton from './components/LoadingSkeleton'
import ContextualFAB from './components/ContextualFAB'
import { TransportProvider, useTransport } from './contexts/TransportContext'
import { CarIcon } from './components/Icons'

function AppContent() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('home')
  const [userRole, setUserRole] = useState('')
  const [journeyData, setJourneyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeScenario, setActiveScenario] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [notification, setNotification] = useState(null)
  const notificationTimeoutRef = useRef(null)
  
  const { resetTransportSelection } = useTransport()

  // Check for stored user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  // Get user location for FAB functionality
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location detection failed:', error)
          // Use default location if needed
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setUserRole('')
    setCurrentView('home')
  }

  const handleNavigate = (view) => {
    // Check if current scenario has unsaved data that needs preservation
    if (activeScenario && MODAL_CATEGORIES.FORMS_WITH_DATA.scenarios.includes(activeScenario)) {
      const hasData = preserveModalData(activeScenario);
      if (hasData) {
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current)
        }
        
        setNotification('💾 Form data saved • Navigating...');
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null)
          notificationTimeoutRef.current = null
        }, 2000);
      }
    }
    
    setCurrentView(view)
    if (view === 'home') {
      setUserRole('')
      setActiveScenario(null)
    }
  }

  const handleRoleSelect = (role) => {
    setUserRole(role)
  }

  const handleRideRequest = (type, routeData) => {
    console.log('App.jsx handleRideRequest called with:', { type, routeData });
    setJourneyData({
      pickup: {
        coordinates: [routeData.pickup.lng, routeData.pickup.lat],
        address: routeData.pickup.address
      },
      destination: {
        coordinates: [routeData.destination.lng, routeData.destination.lat],
        address: routeData.destination.address
      },
      routeInfo: routeData.routeInfo
    });
    setUserRole('passenger');
  };

  const handleRideOffer = (type, routeData) => {
    console.log('App.jsx handleRideOffer called with:', { type, routeData });
    setJourneyData({
      pickup: {
        coordinates: [routeData.pickup.lng, routeData.pickup.lat],
        address: routeData.pickup.address
      },
      destination: {
        coordinates: [routeData.destination.lng, routeData.destination.lat],
        address: routeData.destination.address
      },
      routeInfo: routeData.routeInfo
    });
    setUserRole('rider');
  };

  const handleGoBack = () => {
    setUserRole('')
    setJourneyData(null)
    setCurrentView('home')
    setActiveScenario(null)
  }

  // Modal Data Preservation Categories
  const MODAL_CATEGORIES = {
    FORMS_WITH_DATA: {
      scenarios: ['spot_transport', 'emergency_transport', 'share_ride'],
      behavior: 'PRESERVE_DATA' // Save to localStorage before closing
    },
    NAVIGATION_VIEWS: {
      scenarios: ['user_profile', 'history', 'settings', 'contribution_history'], 
      behavior: 'CLOSE_IMMEDIATELY' // No data to preserve
    },
    QUICK_INFO: {
      scenarios: ['explore_options', 'community_help'],
      behavior: 'CLOSE_IMMEDIATELY' // No forms
    }
  };

  // Helper function to preserve modal data (only if changed from defaults)
  const preserveModalData = (currentScenario) => {
    try {
      // Auto-save all form content to localStorage
      const contentBackup = {
        timestamp: new Date().toISOString(),
        scenario: currentScenario,
        forms: {}
      };

      // Capture all form data that has been modified from defaults
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
      Array.from(inputs).forEach((input, index) => {
        const currentValue = input.value ? input.value.trim() : '';
        const defaultValue = input.defaultValue ? input.defaultValue.trim() : '';
        const placeholder = input.placeholder || '';
        
        // Only save if:
        // 1. Field has actual content AND
        // 2. Content is different from default value AND
        // 3. Content is not just the placeholder text
        const hasRealContent = currentValue.length > 0;
        const isDifferentFromDefault = currentValue !== defaultValue;
        const isNotPlaceholder = currentValue !== placeholder;
        
        if (hasRealContent && isDifferentFromDefault && isNotPlaceholder) {
          const fieldKey = `field_${index}_${input.name || input.id || 'unnamed'}`;
          contentBackup.forms[fieldKey] = {
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || '',
            id: input.id || '',
            value: currentValue,
            defaultValue: defaultValue,
            placeholder: placeholder,
            label: input.getAttribute('aria-label') || ''
          };
        }
      });

      // Also check for file inputs (like photos)
      const fileInputs = document.querySelectorAll('input[type="file"]');
      Array.from(fileInputs).forEach((input, index) => {
        if (input.files && input.files.length > 0) {
          const fieldKey = `file_${index}_${input.name || input.id || 'unnamed'}`;
          contentBackup.forms[fieldKey] = {
            type: 'file',
            name: input.name || '',
            id: input.id || '',
            fileCount: input.files.length,
            fileName: input.files[0].name,
            fileSize: input.files[0].size
          };
        }
      });

      // Only save if there's actual modified content
      if (Object.keys(contentBackup.forms).length > 0) {
        // Check if we recently saved this data to avoid spam
        const existingBackup = localStorage.getItem(`modal_backup_${currentScenario}`);
        if (existingBackup) {
          try {
            const existing = JSON.parse(existingBackup);
            const timeDiff = new Date() - new Date(existing.timestamp);
            // If saved within last 10 seconds, don't save again
            if (timeDiff < 10000) {
              console.log('⏭️ Skipping save - data recently preserved for:', currentScenario);
              return false;
            }
          } catch (error) {
            // Continue with save if parsing fails
          }
        }
        
        localStorage.setItem(`modal_backup_${currentScenario}`, JSON.stringify(contentBackup));
        console.log('💾 Modal data preserved for:', currentScenario, Object.keys(contentBackup.forms).length, 'modified fields');
        return true;
      } else {
        console.log('⏭️ No modified data to preserve for:', currentScenario);
        return false;
      }
    } catch (error) {
      console.warn('Error preserving modal data:', error);
      return false;
    }
  };

  const handleScenarioSelect = (scenario) => {
    console.log('🎯 Scenario selected:', scenario, 'Current view:', currentView, 'Current scenario:', activeScenario)
    
    // 1. Check if current scenario has unsaved data that needs preservation
    if (activeScenario && MODAL_CATEGORIES.FORMS_WITH_DATA.scenarios.includes(activeScenario)) {
      const hasData = preserveModalData(activeScenario);
      if (hasData) {
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current)
        }
        
        setNotification('💾 Form data saved • Switching views...');
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null)
          notificationTimeoutRef.current = null
        }, 2000);
      }
    }
    
    // 2. For map-dependent scenarios, auto-navigate to map view
    const mapDependentScenarios = ['spot_transport', 'emergency_transport', 'explore_options']
    if (mapDependentScenarios.includes(scenario) && currentView !== 'home') {
      console.log('📍 Auto-navigating to map for scenario:', scenario)
      
      // Show navigation notification
      if (!notification) { // Don't override data preservation notification
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current)
        }
        
        setNotification('📍 Navigating to map for location selection...')
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null)
          notificationTimeoutRef.current = null
        }, 2000)
      }
      
      // Close current modal and navigate to map view
      setActiveScenario(null)
      setCurrentView('home')
      
      // Delay scenario activation to ensure map is rendered
      setTimeout(() => {
        console.log('🎯 Activating scenario after navigation:', scenario)
        setActiveScenario(scenario)
      }, 200) // Slightly longer delay for smooth transition
      
      return // Don't set scenario immediately
    }
    
    // 3. For same-view scenarios, close current and open new with smooth transition
    if (activeScenario !== scenario) {
      setActiveScenario(null) // Close current modal
      
      // Brief delay for smooth modal transition
      setTimeout(() => {
        setActiveScenario(scenario)
      }, 100)
    } else {
      // Same scenario - just ensure it's active
      setActiveScenario(scenario)
    }
  }

  const handleScenarioComplete = () => {
    // Clear any preserved data for completed scenario
    if (activeScenario) {
      localStorage.removeItem(`modal_backup_${activeScenario}`);
      console.log('🗑️ Cleared preserved data for completed scenario:', activeScenario);
    }
    setActiveScenario(null)
  }

  const handleNotification = (message) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    
    setNotification(message)
    
    // Set new timeout
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimeoutRef.current = null
    }, 3000)
  }

  // Clear notification function (for close button)
  const clearNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
      notificationTimeoutRef.current = null
    }
    setNotification(null)
  }

  // Helper function to restore modal data when reopening forms
  const restoreModalData = (scenario) => {
    try {
      const backupKey = `modal_backup_${scenario}`;
      const savedData = localStorage.getItem(backupKey);
      
      if (savedData) {
        const backup = JSON.parse(savedData);
        console.log('🔄 Restoring modal data for:', scenario, Object.keys(backup.forms || {}).length, 'fields');
        
        // Delay restoration to ensure form elements are rendered
        setTimeout(() => {
          let restoredCount = 0;
          
          Object.entries(backup.forms || {}).forEach(([fieldKey, fieldData]) => {
            // Skip file inputs - they can't be restored for security reasons
            if (fieldData.type === 'file') {
              console.log('⚠️ Cannot restore file input:', fieldData.fileName, '(browser security restriction)');
              return;
            }
            
            // Try to find the input by name, id, or position
            const selectors = [
              fieldData.name ? `input[name="${fieldData.name}"]` : null,
              fieldData.id ? `input[id="${fieldData.id}"]` : null,
              fieldData.name ? `textarea[name="${fieldData.name}"]` : null,
              fieldData.id ? `textarea[id="${fieldData.id}"]` : null,
              fieldData.name ? `select[name="${fieldData.name}"]` : null,
              fieldData.id ? `select[id="${fieldData.id}"]` : null
            ].filter(Boolean);
            
            let input = null;
            for (const selector of selectors) {
              input = document.querySelector(selector);
              if (input) break;
            }
            
            // If still not found, try by placeholder
            if (!input && fieldData.placeholder) {
              input = document.querySelector(`input[placeholder="${fieldData.placeholder}"]`) ||
                     document.querySelector(`textarea[placeholder="${fieldData.placeholder}"]`);
            }
            
            if (input && fieldData.value) {
              // Only restore if current value is still default/empty
              const currentValue = input.value ? input.value.trim() : '';
              const defaultValue = input.defaultValue ? input.defaultValue.trim() : '';
              
              if (currentValue === defaultValue || currentValue === '') {
                input.value = fieldData.value;
                
                // Trigger change event for React components
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                
                restoredCount++;
                console.log('🔄 Restored field:', fieldData.name || fieldData.id || 'unnamed', '=', fieldData.value);
              } else {
                console.log('⏭️ Skipped restoration for modified field:', fieldData.name || fieldData.id || 'unnamed');
              }
            }
          });
          
          // Show restoration notification only if data was actually restored
          if (restoredCount > 0) {
            // Clear any existing timeout
            if (notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current)
            }
            
            setNotification(`🔄 Restored ${restoredCount} field${restoredCount > 1 ? 's' : ''} from previous session`);
            notificationTimeoutRef.current = setTimeout(() => {
              setNotification(null)
              notificationTimeoutRef.current = null
            }, 2500);
          }
          
        }, 300); // Allow time for modal to fully render
        
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error restoring modal data:', error);
      return false;
    }
  };

  // Watch for activeScenario changes to restore data
  useEffect(() => {
    if (activeScenario && MODAL_CATEGORIES.FORMS_WITH_DATA.scenarios.includes(activeScenario)) {
      restoreModalData(activeScenario);
    }
  }, [activeScenario]);

  // Check for preserved content on app load
  useEffect(() => {
    const checkForBackupContent = () => {
      try {
        const backup = localStorage.getItem('fab_navigation_backup');
        if (backup) {
          const backupData = JSON.parse(backup);
          const fieldCount = Object.keys(backupData.forms).length;
          const timeAgo = new Date(backupData.timestamp);
          const minutesAgo = Math.floor((Date.now() - timeAgo.getTime()) / 60000);
          
          if (fieldCount > 0 && minutesAgo < 30) { // Show if recent (< 30 min)
            setNotification(`💾 ${fieldCount} saved field(s) from ${minutesAgo}m ago available - check browser console`);
            console.log('💾 Preserved content available:', backupData);
          }
        }
      } catch (error) {
        console.warn('Error checking backup content:', error);
      }
    };

    if (user) {
      setTimeout(checkForBackupContent, 2000); // Check after app loads
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="app">
        <header>
          <h1><CarIcon size={32} /> Ride Share MVP</h1>
        </header>
        <main>
          <LoadingSkeleton type="card" count={2} />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header>
          <h1><CarIcon size={32} /> Ride Share MVP</h1>
        </header>
        <main>
          <Login onLogin={handleLogin} />
        </main>
      </div>
    )
  }

  const renderContent = () => {
    // Handle specific user role flows (preserve existing functionality)
    if (userRole) {
      if (userRole === 'rider') {
        return <RiderFlow user={user} journeyData={journeyData} />;
      }
      if (userRole === 'passenger') {
        return <PassengerFlow user={user} journeyData={journeyData} />;
      }
    }

    // Show navigation-based content
    switch (currentView) {
      case 'ride-history':
        return <RideHistory user={user} />;
      case 'active-rides':
        return <ActiveRides user={user} />;
      case 'profile':
        return <Profile user={user} onLogout={handleLogout} />;
      case 'contributions':
        return (
          <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <UserContributionHistory userId={user.id} user={user} />
          </div>
        );
      case 'home':
      default:
        // Always show live city map as primary interface
        return (
          <LiveCityMap 
            user={user} 
            activeScenario={activeScenario}
            onScenarioSelect={handleScenarioSelect}
            onScenarioComplete={handleScenarioComplete}
            onRideRequest={handleRideRequest}
            onRideOffer={handleRideOffer}
            journeyData={journeyData}
          />
        );
    }
  };

  return (
    <div className="app">
      <Header
        user={user}
        currentView={currentView}
        userRole={userRole}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      
      <main>
        {renderContent()}
      </main>

      {/* Global FAB - Always visible when user is logged in */}
      {user && (
        <ContextualFAB 
          onScenarioSelect={handleScenarioSelect}
          user={user}
          activeScenario={activeScenario}
          onScenarioComplete={handleScenarioComplete}
          userLocation={userLocation}
          currentView={currentView}
          onNavigate={handleNavigate}
          onNotification={handleNotification}
        />
      )}

      {/* Navigation Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(33, 150, 243, 0.95)',
          color: 'white',
          padding: '12px 20px 12px 24px',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 16000,
          boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
          animation: 'slideInFromTop 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: 'calc(100vw - 40px)'
        }}>
          <span style={{ flex: 1 }}>{notification}</span>
          <button
            onClick={clearNotification}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              lineHeight: '1',
              transition: 'background 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            title="Close notification"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <TransportProvider>
      <AppContent />
    </TransportProvider>
  );
}

export default App
