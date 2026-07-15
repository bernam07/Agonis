import { describe, expect, it, vi } from 'vitest'
import Footer from '../../components/common/Footer'
import { renderIntoDocument } from '../testUtils'

describe('Footer', () => {
  it('renders support links and navigates to faq and policy', () => {
    const onNavigate = vi.fn()
    const { container, cleanup } = renderIntoDocument(<Footer onNavigate={onNavigate} />)

    expect(container.textContent).toContain('FAQ')
    expect(container.textContent).toContain('Privacy Policy')

    ;(container.querySelector('button') as HTMLButtonElement).click()
    expect(onNavigate).toHaveBeenCalledWith('faq')

    const buttons = container.querySelectorAll('button')
    ;(buttons[1] as HTMLButtonElement).click()
    expect(onNavigate).toHaveBeenCalledWith('policy')

    cleanup()
  })
})
