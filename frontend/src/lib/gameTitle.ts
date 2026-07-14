/*
 Copyright 2026 Bernardo Miguel Fernandes Martins

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// Strips common re-release/edition suffixes so different SKUs of the same
// game (e.g. "Halo Infinite" vs "Halo Infinite: Deluxe Edition") collapse
// to the same key for de-duplication purposes.
const EDITION_SUFFIX =
  /[:\-–—]?\s*(the\s+)?((digital\s+)?deluxe|special|collector'?s|anniversary|enhanced|complete|ultimate|standard|extended|essential|classic|legendary|gold|day\s*one|definitive|game\s*of\s*the\s*year|goty)(\s+edition)?$|[:\-–—]?\s*(remaster(ed)?|remake|director'?s\s*cut|hd)$/i

export function normalizeGameTitle(name: string | undefined | null): string {
  if (!name) return ''
  let normalized = name.trim().toLowerCase()
  // Strip edition/re-release suffixes repeatedly (titles can stack more than one, e.g. "X: Remastered - Deluxe Edition").
  let previous: string
  do {
    previous = normalized
    normalized = normalized.replace(EDITION_SUFFIX, '').trim()
  } while (normalized !== previous && normalized.length > 0)
  return normalized || name.trim().toLowerCase()
}

export function dedupeGamesByTitle<T extends { name?: string; game_name?: string }>(games: T[]): T[] {
  const seen = new Set<string>()
  return games.filter((game) => {
    const key = normalizeGameTitle(game.name ?? game.game_name)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
