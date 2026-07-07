import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'
import './index.css'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

if (sentryDsn && import.meta.env.PROD) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {React.createElement(App as unknown as React.ComponentType)}
    </ErrorBoundary>
  </React.StrictMode>,
)