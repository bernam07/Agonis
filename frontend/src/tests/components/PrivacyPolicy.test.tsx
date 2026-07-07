import { describe, expect, it } from 'vitest'
import PrivacyPolicy from '../../components/PrivacyPolicy'
import { renderIntoDocument } from '../testUtils'

describe('PrivacyPolicy', () => {
  it('renders the privacy sections', () => {
    const { container, cleanup } = renderIntoDocument(<PrivacyPolicy />)

    expect(container.textContent).toContain('Privacy Policy')
    expect(container.textContent).toContain('Information We Collect')
    expect(container.textContent).toContain('Third-Party Services')

    cleanup()
  })
})
