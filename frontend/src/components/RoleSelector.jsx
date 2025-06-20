function RoleSelector({ onRoleSelect }) {
  return (
    <div className="role-selector">
      <h2>Welcome to Ride Share!</h2>
      <p>Are you offering a ride or looking for one?</p>
      
      <div className="role-buttons">
        <button 
          className="role-btn rider-btn"
          onClick={() => onRoleSelect('rider')}
        >
          <div className="role-icon">🚗</div>
          <h3>I'm a Rider</h3>
          <p>I'm driving and can pick someone up</p>
        </button>
        
        <button 
          className="role-btn passenger-btn"
          onClick={() => onRoleSelect('passenger')}
        >
          <div className="role-icon">🚶</div>
          <h3>I'm a Passenger</h3>
          <p>I need a ride to my destination</p>
        </button>
      </div>
    </div>
  )
}

export default RoleSelector