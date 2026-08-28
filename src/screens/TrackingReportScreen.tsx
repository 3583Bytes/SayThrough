import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../hooks/useTheme'
import { useEffect, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { UI_COLORS } from '../constants/colors'
import { storage } from '../storage'
import { useUserStore } from '../stores/userStore'

interface Report {
  pressesToday: number
  messagesToday: number
  presses7d: number
  messages7d: number
  topWords: Array<[string, number]>
}

// §5.9 basic report — today + 7-day totals and most-used words.
// Calendar heatmap, CSV export, and modeling separation arrive with
// the fuller SLP tooling.
export function TrackingReportScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const activeUser = useUserStore((s) => s.activeUser)
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    if (!activeUser) return
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    storage.getTrackingEvents(activeUser.id, sevenDaysAgo).then((events) => {
      const presses = events.filter((e) => e.eventType === 'button_press')
      const messages = events.filter((e) => e.eventType === 'message_spoken')
      const counts = new Map<string, number>()
      for (const press of presses) {
        if (!press.buttonLabel) continue
        counts.set(press.buttonLabel, (counts.get(press.buttonLabel) ?? 0) + 1)
      }
      setReport({
        pressesToday: presses.filter((e) => e.timestamp >= startOfToday).length,
        messagesToday: messages.filter((e) => e.timestamp >= startOfToday).length,
        presses7d: presses.length,
        messages7d: messages.length,
        topWords: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
      })
    })
  }, [activeUser])

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.screen }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to settings"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={[styles.backText, { color: theme.text }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Communication Data</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {report && (
          <>
            <View style={styles.statsRow}>
              <Stat label="Buttons today" value={report.pressesToday} />
              <Stat label="Messages today" value={report.messagesToday} />
              <Stat label="Buttons (7 days)" value={report.presses7d} />
              <Stat label="Messages (7 days)" value={report.messages7d} />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Most used words (7 days)</Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]} testID="report-words">
              {report.topWords.length === 0 && (
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  No data yet — communication will appear here once tracking
                  is on and buttons are pressed.
                </Text>
              )}
              {report.topWords.map(([word, count], index) => (
                <View key={word} style={styles.wordRow}>
                  <Text style={[styles.wordRank, { color: theme.textMuted }]}>{index + 1}.</Text>
                  <Text style={[styles.wordLabel, { color: theme.text }]}>{word}</Text>
                  <Text style={[styles.wordCount, { color: theme.accent }]}>{count}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.hint, { color: theme.textMuted }]}>
              All data stays on this device. Least-used-word reports, CSV
              export, and modeling separation are planned (§4.13).
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  const theme = useTheme()
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface }]}>
      <Text style={[styles.statValue, { color: theme.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UI_COLORS.barBackground,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.barBorder,
    paddingHorizontal: 8,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    minWidth: 60,
  },
  body: {
    padding: 16,
    gap: 12,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
    padding: 14,
    gap: 6,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  wordRank: {
    width: 24,
    color: '#999999',
    fontWeight: '600',
  },
  wordLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  wordCount: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 13,
    color: '#777777',
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.7,
  },
})
