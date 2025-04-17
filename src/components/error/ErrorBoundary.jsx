import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Error Boundary component to catch and handle runtime errors
 * Provides a fallback UI when child components crash
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Catch errors in any child components
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log the error details
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Here you could also log to an error reporting service like Sentry
    // if integrated into your application
  }

  // Reset the error state to allow recovery
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    // If there's no error, render children normally
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Fallback UI when an error occurs
    return (
      <div className="error-boundary">
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>We're sorry, but an unexpected error has occurred.</p>
          
          {/* Show error details in development mode only */}
          {import.meta.env.DEV && this.state.error && (
            <div className="error-details">
              <h3>Error Details:</h3>
              <p className="error-message">{this.state.error.toString()}</p>
              
              {this.state.errorInfo && (
                <details>
                  <summary>Component Stack</summary>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          )}
          
          <div className="error-actions">
            <button 
              onClick={this.resetErrorBoundary}
              className="btn btn-primary"
            >
              Try Again
            </button>
            <Link to="/" className="btn btn-secondary">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;