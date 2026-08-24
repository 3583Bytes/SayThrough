import { storage } from '../storage'

// §18.3 vocabulary source — every word the user already has a button for.
// Prediction driven purely by a generic corpus feels wrong to AAC users:
// the words they most want are the ones already meaningful in their own page
// set, and those are often names and foods a film corpus ranks nowhere.
//
// Rebuilt when the keyboard opens rather than cached with invalidation hooks
// on every edit path: a page set is a few hundred rows, the rebuild happens on
// an explicit user action (not per keystroke), and it is always current no
// matter what was edited since.

export async function collectVocabulary(pageSetId: string): Promise<Set<string>> {
  const words = new Set<string>()
  try {
    const pages = await storage.getPagesForPageSet(pageSetId)
    for (const page of pages) {
      for (const button of await storage.getButtonsForPage(page.id)) {
        // Phrase buttons ("all done") contribute each of their words.
        for (const word of button.label.split(/\s+/)) {
          const clean = word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
          if (clean.length > 1) words.add(clean)
        }
      }
    }
  } catch {
    // Prediction still works off the base lexicon.
  }
  return words
}
