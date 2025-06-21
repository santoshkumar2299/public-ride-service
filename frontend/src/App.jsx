import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import Header from './components/Header'
import LiveCityMap from './components/LiveCityMap'
import RiderFlow from './components/RiderFlow'
import PassengerFlow from './components/PassengerFlow'
import RideHistory from './components/RideHistory'
import ActiveRides from './components/ActiveRides'
import Profile from './components/Profile'
import LoadingSkeleton from './components/LoadingSkeleton'
import { TransportProvider, useTransport } from './contexts/TransportContext'
import { CarIcon } from './components/Icons'

function AppContent() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('home')
  const [userRole, setUserRole] = useState('')
  const [journeyData, setJourneyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeScenario, setActiveScenario] = useState(null)
  
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

  const handleScenarioSelect = (scenario) => {
    console.log('Scenario selected:', scenario)
    setActiveScenario(scenario)
  }

  const handleScenarioComplete = () => {
    setActiveScenario(null)
  }

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
