import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { UI_COLORS } from '../../constants/colors'
import { FONTS } from '../../constants/typography'
import { createLinkedPage } from '../../services/pageService'
import { storage } from '../../storage'
import { useNavigationStore } from '../../stores/navigationStore'
import type { Page } from '../../types/models'

interface PageLinkModalProps {
  visible: boolean
  currentPageId: string // exclude self-links
  onSelect: (pageId: string) => void
  onRemoveLink: () => void
  hasLink: boolean
  onClose: () => void
}

// "This button opens…" — pick an existing page or create a new one.
// New pages get the persistent core region by default (§19.2/§19.6);
// pages are only ever created here, so orphans can't exist.
export function PageLinkModal({
  visible,
  currentPageId,
  onSelect,
  onRemoveLink,
  hasLink,
  onClose,
}: PageLinkModalProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [newPageName, setNewPageName] = useState('')
  const [includeCore, setIncludeCore] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!visible) return
    const pageSetId = useNavigationStore.getState().activePageSetId
    if (!pageSetId) return
    storage.getPagesForPageSet(pageSetId).then((loaded) => {
      setPages(loaded.filter((page) => page.id !== currentPageId))
    })
    setNewPageName('')
    setIncludeCore(true)
  }, [visible, currentPageId])

  const createAndLink = async () => {
    const name = newPageName.trim()
    const pageSetId = useNavigationStore.getState().activePageSetId
    if (!name || !pageSetId || busy) return
    setBusy(true)
    try {
      const page = await createLinkedPage(pageSetId, name, includeCore)
      onSelect(page.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>This button opens…</Text>

          <ScrollView style={styles.pageList}>
            {pages.map((page) => (
              <Pressable
                key={page.id}
                accessibilityRole="button"
                accessibilityLabel={`Link to page ${page.name}`}
                onPress={() => onSelect(page.id)}
                style={({ pressed }) => [styles.pageRow, pressed && styles.pressed]}
              >
                <Text style={styles.pageName}>{page.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>…or a new page</Text>
          <TextInput
            value={newPageName}
            onChangeText={setNewPageName}
            placeholder="New page name (e.g. Minecraft)"
            style={styles.input}
            accessibilityLabel="New page name"
            onSubmitEditing={createAndLink}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Include core words (same left columns as every page)
            </Text>
            <Switch
              value={includeCore}
              onValueChange={setIncludeCore}
              accessibilityLabel="Include core words on new page"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create page and link"
            onPress={createAndLink}
            style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          >
            <Text style={styles.createText}>
              {busy ? 'Creating…' : 'Create page & link'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            {hasLink && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove link"
                onPress={onRemoveLink}
                style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
              >
                <Text style={styles.removeText}>Remove link</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel page link"
              onPress={onClose}
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  pageList: {
    maxHeight: 220,
    flexGrow: 0,
  },
  pageRow: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageName: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  sectionLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#888888',
  },
  input: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  switchLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#555555',
    flexShrink: 1,
  },
  createButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: UI_COLORS.speakGreen,
  },
  createText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  removeText: {
    color: UI_COLORS.clearRed,
    fontFamily: FONTS.bold,
  },
  cancelText: {
    color: '#666666',
    fontFamily: FONTS.bold,
  },
  pressed: {
    opacity: 0.7,
  },
})
