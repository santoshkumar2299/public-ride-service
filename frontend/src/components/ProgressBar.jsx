const ProgressBar = ({ 
  progress = 0, 
  showLabel = true, 
  label = "", 
  color = "#007bff", 
  height = "8px",
  animated = false 
}) => {
  const progressPercentage = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-container">
      {showLabel && (
        <div className="progress-label">
          <span>{label}</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
      )}
      <div className="progress-bar" style={{ height }}>
        <div 
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{ 
            width: `${progressPercentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;