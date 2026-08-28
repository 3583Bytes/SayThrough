// Shared between the English (`morphology.ts`) and Spanish
// (`morphology.es.ts`) engines. Its own module so the two never import each
// other — the dispatcher in `morphology.ts` is the only thing that knows both.

export interface WordForm {
  value: string // the inflected word to insert
  hint: string // short grammatical label shown under it ('' for the base)
}

/**
 * What the caller already knows about the sentence being built. English
 * ignores this; Spanish needs it, because an adjective's correct form depends
 * on the noun it modifies — agreement makes inflection a property of the
 * sentence rather than of one button.
 */
export interface MorphContext {
  /** Words already in the message bar, in order, most recent last. */
  precedingWords?: string[]
}
