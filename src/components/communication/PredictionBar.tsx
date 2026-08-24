import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FONTS } from '../../constants/typography'
import { useTheme } from '../../hooks/useTheme'
import type { Prediction } from '../../services/prediction'

// §18 prediction bar. Two AAC-specific rules a generic autocomplete would
// break:
//
//   1. The slot COUNT and POSITIONS are fixed. Short lists are padded with
//      empty slots rather than letting the row shrink or re-center. A bar that
//      changes shape between keystrokes destroys the motor plan the user is
//      building and causes mis-hits — the same invariant as §19.5, applied to
//      the keyboard.
//   2. Slots keep the same touch target as the keys below them (48px), so a
//      user who can hit a letter can hit a suggestion.
export const PREDICTION_SLOTS = 4

/** Scan id for slot `index` — shared with the keyboard's scanning model. */
export const predictionSlotId = (index: number) => `pred-${index}`

export function PredictionBar({
  predictions,
  onSelect,
  highlightedIds,
}: {
  predictions: Prediction[]
  onSelect: (word: string) => void
  /** Scan highlight (§AM-05), by slot id. */
  highlightedIds?: Set<string>
}) {
  const theme = useTheme()
  const slots = Array.from({ length: PREDICTION_SLOTS }, (_, i) => predictions[i])

  return (
    <View style={styles.bar} accessibilityLabel="Word suggestions">
      {slots.map((prediction, index) => {
        const highlighted = highlightedIds?.has(predictionSlotId(index)) ?? false
        if (!prediction) {
          return (
            <View
              key={`empty-${index}`}
              style={[styles.slot, styles.empty, { borderColor: theme.border }]}
              // Empty slots hold the layout open; they are not targets.
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          )
        }
        return (
          <Pressable
            key={prediction.word}
            accessibilityRole="button"
            accessibilityLabel={`Insert ${prediction.word}`}
            onPress={() => onSelect(prediction.word)}
            style={({ pressed }) => [
              styles.slot,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              highlighted && styles.highlighted,
              pressed && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.word, { color: theme.text }]}
            >
              {prediction.word}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  slot: {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  empty: {
    // Present but inert — the row must not reflow when there are fewer
    // suggestions than slots.
    opacity: 0.35,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  highlighted: {
    backgroundColor: '#BBDEFB',
  },
  word: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.6,
  },
})
