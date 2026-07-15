import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'
import CookieConsentBanner from './components/common/CookieConsentBanner.tsx'
import { CookieConsentProvider } from './context/CookieConsentContext.tsx'
import { initSentryIfConsented } from './lib/sentry.ts'
import './index.css'

initSentryIfConsented()

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
        <CookieConsentProvider>
          {React.createElement(App as unknown as React.ComponentType)}
          <Toaster richColors position="top-center" theme="system" />
          <CookieConsentBanner />
        </CookieConsentProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)