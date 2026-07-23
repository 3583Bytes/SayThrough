import { useCallback, useEffect, useState } from 'react'
import { storage } from '../storage'
import type { Button, Page } from '../types/models'

// Loads the current page and its buttons whenever pageId changes;
// refresh() re-reads after edit-mode mutations
export function usePageButtons(pageId: string | null) {
  const [page, setPage] = useState<Page | null>(null)
  const [buttons, setButtons] = useState<Button[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!pageId) return
    let cancelled = false
    Promise.all([storage.getPage(pageId), storage.getButtonsForPage(pageId)]).then(
      ([loadedPage, loadedButtons]) => {
        if (cancelled) return
        setPage(loadedPage)
        setButtons(loadedButtons)
      },
    )
    return () => {
      cancelled = true
    }
  }, [pageId, reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  return { page, buttons, refresh }
}
