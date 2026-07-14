import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { ReactElement } from 'react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// When vi.useFakeTimers() is active, React Query's internal scheduling (which
// leans on setTimeout in places) needs fake timers advanced to make progress,
// not just a microtask tick — a plain Promise.resolve() alone stalls forever.
async function tick() {
  if (vi.isFakeTimers()) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
  } else {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

export async function flushAsync(times = 5) {
  for (let i = 0; i < times; i++) {
    await tick()
  }
}

// Retries `callback` across ticks until it stops throwing.
export async function waitFor(callback: () => void, maxTries = 50) {
  for (let i = 0; i < maxTries; i++) {
    try {
      callback()
      return
    } catch (error) {
      if (i === maxTries - 1) throw error
      await tick()
    }
  }
}

export function setNativeInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderIntoDocument(element: ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const queryClient = createTestQueryClient()
  const root = createRoot(container)

  act(() => {
    root.render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>)
  })

  return {
    container,
    root,
    queryClient,
    cleanup() {
      act(() => {
        root.unmount()
      })
      document.body.removeChild(container)
      queryClient.clear()
    },
  }
}
