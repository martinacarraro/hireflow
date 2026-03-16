import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import './index.css'
import './i18n/index.js'
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#0E0E1A', color: 'white', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px', fontFamily: 'monospace'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
          <h2 style={{ color: '#FF2D8B', marginBottom: 12, textAlign: 'center' }}>Errore app</h2>
          <div style={{
            background: '#1A1A2E', border: '1px solid #333', borderRadius: 12,
            padding: 16, maxWidth: 400, width: '100%', wordBreak: 'break-word'
          }}>
            <p style={{ color: '#FF6B6B', fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>
              {this.state.error?.name}: {this.state.error?.message}
            </p>
            <p style={{ color: '#888', fontSize: 11, whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack?.split('\n').slice(0,5).join('\n')}
            </p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload() }}
            style={{
              marginTop: 24, background: '#7B2FFF', color: 'white', border: 'none',
              borderRadius: 12, padding: '12px 24px', fontSize: 14, cursor: 'pointer'
            }}>
            🔄 Reset e ricarica
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </ErrorBoundary>
)