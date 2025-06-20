import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import Header from './components/Header'
import MapFirstView from './components/MapFirstView'
import RiderFlow from './components/RiderFlow'
import PassengerFlow from './components/PassengerFlow'
import RideHistory from './components/RideHistory'
import ActiveRides from './components/ActiveRides'
import Profile from './components/Profile'
import LoadingSkeleton from './components/LoadingSkeleton'
import { CarIcon } from './components/Icons'

function App() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('home')
  const [userRole, setUserRole] = useState('')
  const [journeyData, setJourneyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

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
    if (userRole) {
      // Show ride flows when a role is selected
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
        return (
          <MapFirstView 
            user={user} 
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
        journeyData={journeyData}
        onNavigate={handleNavigate}
        onGoBack={handleGoBack}
        onLogout={handleLogout}
      />
      
      <main>
        {renderContent()}
      </main>
    </div>
  )
}

export default App
