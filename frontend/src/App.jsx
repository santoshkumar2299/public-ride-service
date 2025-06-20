import { useState } from 'react'
import './App.css'
import RoleSelector from './components/RoleSelector'
import RiderFlow from './components/RiderFlow'
import PassengerFlow from './components/PassengerFlow'

function App() {
  const [userRole, setUserRole] = useState('')

  const handleRoleSelect = (role) => {
    setUserRole(role)
  }

  const handleGoBack = () => {
    setUserRole('')
  }

  return (
    <div className="app">
      <header>
        <h1>🚗 Ride Share MVP</h1>
        {userRole && (
          <button onClick={handleGoBack} className="back-btn">
            ← Back to Role Selection
          </button>
        )}
      </header>
      
      <main>
        {!userRole && <RoleSelector onRoleSelect={handleRoleSelect} />}
        {userRole === 'rider' && <RiderFlow />}
        {userRole === 'passenger' && <PassengerFlow />}
      </main>
    </div>
  )
}

export default App
