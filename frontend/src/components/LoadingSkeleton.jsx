const LoadingSkeleton = ({ type = 'default', count = 1 }) => {
  const skeletons = [];
  
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      skeletons.push(
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-subtitle"></div>
            </div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
          </div>
        </div>
      );
    } else if (type === 'list') {
      skeletons.push(
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-circle"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
          </div>
        </div>
      );
    } else {
      skeletons.push(
        <div key={i} className="skeleton-default">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line skeleton-short"></div>
        </div>
      );
    }
  }
  
  return <div className="loading-skeleton">{skeletons}</div>;
};

export default LoadingSkeleton;