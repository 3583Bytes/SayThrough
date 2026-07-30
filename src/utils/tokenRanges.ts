// Maps a TTS word-boundary charIndex (into the spoken string, which is the
// tokens joined by single spaces) back to the token being spoken, so the
// message bar can highlight it word-by-word. Pure + unit-tested.
export function tokenIdAtChar(
  tokens: { id: string; text: string }[],
  charIndex: number,
): string | null {
  let pos = 0
  for (const token of tokens) {
    const end = pos + token.text.length
    if (charIndex >= pos && charIndex < end) return token.id
    pos = end + 1 // account for the joining space
  }
  return null
}
