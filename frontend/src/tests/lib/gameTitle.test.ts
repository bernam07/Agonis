import { describe, expect, it } from 'vitest'
import { dedupeGamesByTitle, normalizeGameTitle } from '../../lib/gameTitle'

describe('normalizeGameTitle', () => {
  it('strips common edition/re-release suffixes', () => {
    expect(normalizeGameTitle('The Last of Us Part II: Special Edition')).toBe('the last of us part ii')
    expect(normalizeGameTitle('The Last of Us Part II Remastered')).toBe('the last of us part ii')
    expect(normalizeGameTitle("The Last of Us Part II: Collector's Edition")).toBe('the last of us part ii')
    expect(normalizeGameTitle('The Last of Us Part I: Digital Deluxe Edition')).toBe('the last of us part i')
    expect(normalizeGameTitle('Halo Infinite')).toBe('halo infinite')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeGameTitle('  HALO INFINITE  ')).toBe('halo infinite')
  })

  it('falls back to the trimmed lowercase name when nothing matches', () => {
    expect(normalizeGameTitle('Portal 2')).toBe('portal 2')
  })

  it('handles missing input', () => {
    expect(normalizeGameTitle(undefined)).toBe('')
    expect(normalizeGameTitle(null)).toBe('')
    expect(normalizeGameTitle('')).toBe('')
  })
})

describe('dedupeGamesByTitle', () => {
  it('keeps only the first occurrence per normalized title', () => {
    const games = [
      { id: 1, name: 'The Last of Us Part II' },
      { id: 2, name: 'The Last of Us Part II: Special Edition' },
      { id: 3, name: "The Last of Us Part II: Collector's Edition" },
      { id: 4, name: 'Halo Infinite' },
    ]

    const result = dedupeGamesByTitle(games)

    expect(result).toEqual([
      { id: 1, name: 'The Last of Us Part II' },
      { id: 4, name: 'Halo Infinite' },
    ])
  })
})
