import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {React.createElement(App as unknown as React.ComponentType)}
        <Toaster richColors position="top-center" theme="system" />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)