import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeMock } from './utils/mockSupabase';
import { seedDatabase } from './utils/seedDatabase';

// Expose seed tool for simulation
window.seedDatabase = seedDatabase;

// Check for Simulation Mode
if (localStorage.getItem('hidracil_offline_mode') === 'true') {
  initializeMock();
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Algo deu errado.</h1>
          <p>Por favor, atualize a página ou contate o suporte.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', color: 'red' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
