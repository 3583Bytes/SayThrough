import { useEffect, useMemo, useState } from 'react'
import {
  getLoadedLexicon,
  loadLexicon,
  rankPredictions,
  type Prediction,
} from '../services/prediction'
import { currentModel } from '../services/predictionModel'
import { collectVocabulary } from '../services/vocabularyIndex'
import { useMessageStore } from '../stores/messageStore'
import { useNavigationStore } from '../stores/navigationStore'
import { useUserStore } from '../stores/userStore'

// §18 — drives the prediction bar. Ranking is synchronous by design: the
// async work (lexicon fetch, vocabulary scan) happens once on mount, so a
// keystroke never awaits.
export function usePredictions(buffer: string, limit = 4): Prediction[] {
  const language = useUserStore((s) => s.activeUser?.language)
  const enabled = useUserStore((s) => s.activeUser?.predictionEnabled ?? true)
  const pageSetId = useNavigationStore((s) => s.activePageSetId)
  const tokens = useMessageStore((s) => s.tokens)

  const [lexicon, setLexicon] = useState<string[]>(getLoadedLexicon)
  const [vocabulary, setVocabulary] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let live = true
    void loadLexicon(language).then((words) => {
      if (live) setLexicon(words)
    })
    return () => {
      live = false
    }
  }, [language])

  useEffect(() => {
    if (!pageSetId) return
    let live = true
    void collectVocabulary(pageSetId).then((words) => {
      if (live) setVocabulary(words)
    })
    return () => {
      live = false
    }
  }, [pageSetId])

  // The word already in the message bar, so "i" + "w…" can favor "want".
  const previousWord = tokens.length ? tokens[tokens.length - 1].text : undefined

  return useMemo(
    () =>
      enabled
        ? rankPredictions(
            buffer,
            previousWord,
            { lexicon, personal: currentModel(), vocabulary, language },
            limit,
          )
        : [],
    [enabled, buffer, previousWord, lexicon, vocabulary, language, limit],
  )
}
