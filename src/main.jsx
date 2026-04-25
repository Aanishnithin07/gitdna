import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[GitDNA] Runtime error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#060b12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 20,
          fontFamily: 'monospace',
        }}>
          <div style={{
            color: '#00dcff',
            fontSize: '2rem',
            fontFamily: 'Orbitron,monospace',
          }}>
            GITDNA
          </div>
          <div style={{
            color: 'rgba(200,232,255,0.5)',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
          }}>
            SYSTEM ERROR — UNEXPECTED STATE
          </div>
          <div style={{
            background: 'rgba(255,69,69,0.1)',
            border: '1px solid rgba(255,69,69,0.3)',
            borderRadius: 6,
            padding: '12px 20px',
            color: 'rgba(255,150,150,0.7)',
            fontSize: '0.72rem',
            maxWidth: 400,
            textAlign: 'center',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,220,255,0.4)',
              color: '#00dcff',
              padding: '10px 24px',
              fontFamily: 'Orbitron,monospace',
              fontSize: '0.72rem',
              cursor: 'pointer',
              borderRadius: 4,
              letterSpacing: '0.1em',
            }}
          >
            ↺ REBOOT SYSTEM
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
