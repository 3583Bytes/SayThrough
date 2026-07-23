import { useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { POS_COLORS, UI_COLORS } from '../../constants/colors'
import type { Button } from '../../types/models'

interface ButtonEditorPanelProps {
  button: Button
  onSave: (changes: Pick<Button, 'label' | 'backgroundColor'>) => void
  onDelete: () => void
  onClose: () => void
}

const COLOR_CHOICES = Object.values(POS_COLORS)

// §5.6 button editor — label + color for now; symbol picker and action
// editing arrive with their features
export function ButtonEditorPanel({
  button,
  onSave,
  onDelete,
  onClose,
}: ButtonEditorPanelProps) {
  const [label, setLabel] = useState(button.label)
  const [backgroundColor, setBackgroundColor] = useState(button.backgroundColor)

  useEffect(() => {
    setLabel(button.label)
    setBackgroundColor(button.backgroundColor)
  }, [button])

  const save = () => {
    onSave({ label: label.trim(), backgroundColor })
    onClose()
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Label</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        style={styles.input}
        accessibilityLabel="Button label"
        placeholder="What should this button say?"
      />

      <Text style={styles.heading}>Color</Text>
      <View style={styles.swatches}>
        {COLOR_CHOICES.map((color) => (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            onPress={() => setBackgroundColor(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              color === backgroundColor && styles.swatchSelected,
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete button"
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>Delete Button</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save button"
          onPress={save}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: UI_COLORS.barBorder,
    padding: 16,
    gap: 8,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  input: {
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#1976D2',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  deleteButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.clearRed,
  },
  deleteText: {
    color: UI_COLORS.clearRed,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: UI_COLORS.speakGreen,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pressed: {
    opacity: 0.7,
  },
})
