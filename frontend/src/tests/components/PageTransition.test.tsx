import { describe, expect, it } from 'vitest'
import PageTransition from '../../components/PageTransition'
import { renderIntoDocument } from '../testUtils'

describe('PageTransition', () => {
  it('renders its children', () => {
    const { container, cleanup } = renderIntoDocument(
      <PageTransition keyProp="home">
        <span>transition child</span>
      </PageTransition>,
    )

    expect(container.textContent).toContain('transition child')
    cleanup()
  })
})
