import React from 'react';

interface State { hasError: boolean; error: any; }

class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0a0a0a',
          color: '#ff4444',
          padding: '40px',
          fontFamily: 'monospace',
          minHeight: '100vh'
        }}>
          <h2 style={{ color: '#ff6666', marginBottom: '20px' }}>
            🔴 Component Crashed
          </h2>
          <div style={{
            background: '#1a0000',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ff4444'
          }}>
            <p style={{ color: '#ffaaaa', marginBottom: '10px' }}>
              <b>Error:</b> {this.state.error?.message}
            </p>
            <pre style={{
              color: '#ff8888',
              fontSize: '12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
