import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch white-screen crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Avoid logging complex objects that might have circular references
    // Only log the message and stack trace string
    const errorMessage = error?.message || String(error);
    console.error("Uncaught error:", errorMessage, errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#fff', height: '100vh' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong (Application Crash)</h2>
          <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', overflow: 'auto', textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
             <pre style={{ color: '#374151', fontSize: '0.875rem' }}>
              {this.state.error && this.state.error.toString()}
             </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);