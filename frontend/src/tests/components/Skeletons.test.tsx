import { describe, expect, it } from 'vitest'
import { GameSkeleton, PostSkeleton } from '../../components/common/Skeletons'
import { renderIntoDocument } from '../testUtils'

describe('Skeletons', () => {
  it('renders the game skeleton', () => {
    const { container, cleanup } = renderIntoDocument(<GameSkeleton />)

    expect(container.firstElementChild?.className).toContain('animate-pulse')
    cleanup()
  })

  it('renders the post skeleton', () => {
    const { container, cleanup } = renderIntoDocument(<PostSkeleton />)

    expect(container.firstElementChild?.className).toContain('animate-pulse')
    cleanup()
  })
})
