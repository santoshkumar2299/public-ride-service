import { useState, useEffect } from 'react';

function BookingFeedbackModal({ 
  isOpen, 
  bookedOption, 
  destination, 
  onClose, 
  onFeedbackSubmit 
}) {
  const [feedback, setFeedback] = useState({
    wasHelpful: null,
    useForFuture: null,
    destinationFeedback: null,
    transportFeedback: null,
    comments: ''
  });

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    onFeedbackSubmit(feedback);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-icon">🎯</div>
          <h3>Help us improve your future rides!</h3>
          <p>Quick feedback to make fast transport even faster</p>
          <button className="feedback-close" onClick={onClose}>×</button>
        </div>

        {/* Booking Summary */}
        <div className="booking-summary">
          <div className="summary-item">
            <span className="summary-label">Just booked:</span>
            <span className="summary-value">
              {bookedOption?.icon} {bookedOption?.provider} to {destination}
            </span>
          </div>
        </div>

        {/* Feedback Questions */}
        <div className="feedback-content">
          {/* Was this helpful? */}
          <div className="feedback-question">
            <label className="question-label">
              💡 Was this suggestion helpful for your urgent trip?
            </label>
            <div className="feedback-options">
              <button
                className={`feedback-btn ${feedback.wasHelpful === true ? 'selected' : ''}`}
                onClick={() => setFeedback(prev => ({ ...prev, wasHelpful: true }))}
              >
                👍 Yes, perfect!
              </button>
              <button
                className={`feedback-btn ${feedback.wasHelpful === false ? 'selected' : ''}`}
                onClick={() => setFeedback(prev => ({ ...prev, wasHelpful: false }))}
              >
                👎 Not quite
              </button>
            </div>
          </div>

          {/* Use for future suggestions */}
          {feedback.wasHelpful !== null && (
            <div className="feedback-question">
              <label className="question-label">
                🚀 Should we use this choice to improve future suggestions?
              </label>
              <div className="feedback-options">
                <button
                  className={`feedback-btn ${feedback.useForFuture === true ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, useForFuture: true }))}
                >
                  ✅ Yes, learn from this
                </button>
                <button
                  className={`feedback-btn ${feedback.useForFuture === false ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, useForFuture: false }))}
                >
                  🚫 No, this was unique
                </button>
              </div>
            </div>
          )}

          {/* Destination learning */}
          {feedback.useForFuture === true && (
            <div className="feedback-question">
              <label className="question-label">
                📍 Should "{destination}" be a quick suggestion for similar times?
              </label>
              <div className="feedback-options">
                <button
                  className={`feedback-btn ${feedback.destinationFeedback === true ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, destinationFeedback: true }))}
                >
                  📌 Yes, remember this destination
                </button>
                <button
                  className={`feedback-btn ${feedback.destinationFeedback === false ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, destinationFeedback: false }))}
                >
                  🔄 No, this was one-time
                </button>
              </div>
            </div>
          )}

          {/* Transport preference learning */}
          {feedback.useForFuture === true && (
            <div className="feedback-question">
              <label className="question-label">
                🚗 Should we prioritize {bookedOption?.type}s for similar trips?
              </label>
              <div className="feedback-options">
                <button
                  className={`feedback-btn ${feedback.transportFeedback === true ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, transportFeedback: true }))}
                >
                  ⭐ Yes, I prefer {bookedOption?.type}s
                </button>
                <button
                  className={`feedback-btn ${feedback.transportFeedback === false ? 'selected' : ''}`}
                  onClick={() => setFeedback(prev => ({ ...prev, transportFeedback: false }))}
                >
                  🔀 No, keep mixing options
                </button>
              </div>
            </div>
          )}

          {/* Optional comments */}
          {feedback.wasHelpful === false && (
            <div className="feedback-question">
              <label className="question-label">
                💬 What would make this better? (optional)
              </label>
              <textarea
                className="feedback-textarea"
                placeholder="e.g., 'Different time estimate', 'Missing bus options', 'Wrong destination suggestions'..."
                value={feedback.comments}
                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="feedback-actions">
          <button className="feedback-skip" onClick={handleSkip}>
            Skip for now
          </button>
          <button 
            className="feedback-submit" 
            onClick={handleSubmit}
            disabled={feedback.wasHelpful === null}
          >
            {feedback.useForFuture === true ? 'Save & Learn' : 'Submit Feedback'}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="feedback-privacy">
          <span className="privacy-text">
            🔒 Used only to improve your personal suggestions. No data shared.
          </span>
        </div>
      </div>
    </div>
  );
}

export default BookingFeedbackModal;