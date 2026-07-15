import { describe, expect, it } from 'vitest'
import LandingPage from '../../components/common/LandingPage'
import { renderIntoDocument } from '../testUtils'

describe('LandingPage', () => {
  it('renders the main call to action', () => {
    const { container, cleanup } = renderIntoDocument(<LandingPage onStart={() => {}} />)

    expect(container.textContent).toContain('Join Agonis for Free')
    expect(container.textContent).toContain('Track, rate, and discuss')

    cleanup()
  })
})