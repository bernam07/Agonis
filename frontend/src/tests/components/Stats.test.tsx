import { describe, expect, it } from 'vitest'
import Stats from '../../components/library/Stats'
import { renderIntoDocument } from '../testUtils'

describe('Stats', () => {
  it('renders an empty state when the library has no games', () => {
    const { container, cleanup } = renderIntoDocument(<Stats library={[]} />)

    expect(container.textContent).toContain('Add games to your library to see stats!')

    cleanup()
  })

  it('renders computed stats and favorites', () => {
    const library = [
      { id: 1, name: 'Game One', status: 'completed', rating: 5, cover: { url: 'cover-1' } },
      { id: 2, name: 'Game Two', status: 'backlog', rating: 3 },
      { id: 3, name: 'Game Three', status: '100_percent', rating: 0 },
    ]

    const { container, cleanup } = renderIntoDocument(<Stats library={library} />)

    expect(container.textContent).toContain('Total Games')
    expect(container.textContent).toContain('3')
    expect(container.textContent).toContain('Completed')
    expect(container.textContent).toContain('2')
    expect(container.textContent).toContain('In Backlog')
    expect(container.textContent).toContain('1')
    expect(container.textContent).toContain('Avg. Rating')
    expect(container.textContent).toContain('4.0')
    expect(container.textContent).toContain('Masterpieces (5 Stars)')
    expect(container.textContent).toContain('Game One')

    cleanup()
  })
})
