import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import LandingPage from '../../components/common/LandingPage'

describe('LandingPage', () => {
  it('renders the main call to action', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = createRoot(container)
    act(() => {
      root.render(<LandingPage onStart={() => {}} />)
    })

    expect(container.textContent).toContain('Join Agonis for Free')
    expect(container.textContent).toContain('Track, rate, and discuss')

    act(() => {
      root.unmount()
    })
    document.body.removeChild(container)
  })
})