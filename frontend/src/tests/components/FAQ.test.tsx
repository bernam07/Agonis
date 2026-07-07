import { describe, expect, it } from 'vitest'
import FAQ from '../../components/legal/FAQ'
import { renderIntoDocument } from '../testUtils'

describe('FAQ', () => {
  it('renders the faq list', () => {
    const { container, cleanup } = renderIntoDocument(<FAQ />)

    expect(container.textContent).toContain('Frequently Asked Questions')
    expect(container.textContent).toContain('What is Agonis?')
    expect(container.textContent).toContain('Is my profile public?')

    cleanup()
  })
})
