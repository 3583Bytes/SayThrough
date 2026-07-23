import { Image } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { POS_COLORS, UI_COLORS } from '../../constants/colors'
import { getSymbolUri } from '../../services/SymbolService'
import type { Button } from '../../types/models'
import { SymbolPickerModal } from './SymbolPickerModal'

export type ButtonEditorChanges = Pick<
  Button,
  'label' | 'backgroundColor' | 'symbolId' | 'customSymbolUri'
>

interface ButtonEditorPanelProps {
  button: Button
  onSave: (changes: ButtonEditorChanges) => void
  onDelete: () => void
  onClose: () => void
}

const COLOR_CHOICES = Object.values(POS_COLORS)

// §5.6 button editor — label, symbol (catalog or photo), color
export function ButtonEditorPanel({
  button,
  onSave,
  onDelete,
  onClose,
}: ButtonEditorPanelProps) {
  const [label, setLabel] = useState(button.label)
  const [backgroundColor, setBackgroundColor] = useState(button.backgroundColor)
  const [symbolId, setSymbolId] = useState(button.symbolId)
  const [customSymbolUri, setCustomSymbolUri] = useState(button.customSymbolUri)
  const [pickerVisible, setPickerVisible] = useState(false)

  useEffect(() => {
    setLabel(button.label)
    setBackgroundColor(button.backgroundColor)
    setSymbolId(button.symbolId)
    setCustomSymbolUri(button.customSymbolUri)
  }, [button])

  const previewUri = customSymbolUri ?? (symbolId ? getSymbolUri(symbolId) : null)

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
    })
    if (result.canceled || !result.assets?.[0]) return
    // Resize to symbol size and store as a data URI so it persists in
    // storage and travels inside .obz exports. manipulateAsync is
    // deprecated in favor of the hook API, but works in event handlers;
    // migrate when the contextual API gets a non-hook entry point.
    const resized = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 300 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    )
    if (resized.base64) {
      setCustomSymbolUri(`data:image/jpeg;base64,${resized.base64}`)
      setSymbolId(undefined)
    }
  }

  const save = () => {
    onSave({ label: label.trim(), backgroundColor, symbolId, customSymbolUri })
    onClose()
  }

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.labelColumn}>
          <Text style={styles.heading}>Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            style={styles.input}
            accessibilityLabel="Button label"
            placeholder="What should this button say?"
          />
        </View>
        <View style={styles.symbolColumn}>
          <Text style={styles.heading}>Symbol</Text>
          <View style={styles.symbolRow}>
            <View style={styles.symbolPreview}>
              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={styles.symbolImage}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.noSymbol}>none</Text>
              )}
            </View>
            <View style={styles.symbolActions}>
              <SmallAction
                label="Change…"
                accessibilityLabel="Change symbol"
                onPress={() => setPickerVisible(true)}
              />
              <SmallAction
                label="Photo…"
                accessibilityLabel="Use a photo as symbol"
                onPress={pickPhoto}
              />
              {previewUri && (
                <SmallAction
                  label="Remove"
                  accessibilityLabel="Remove symbol"
                  onPress={() => {
                    setSymbolId(undefined)
                    setCustomSymbolUri(undefined)
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </View>

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

      <SymbolPickerModal
        visible={pickerVisible}
        initialQuery={label.trim()}
        onSelect={(id) => {
          setSymbolId(id)
          setCustomSymbolUri(undefined)
          setPickerVisible(false)
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  )
}

function SmallAction({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string
  accessibilityLabel: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
    >
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
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
  topRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  labelColumn: {
    flex: 1,
    minWidth: 200,
    gap: 8,
  },
  symbolColumn: {
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
  symbolRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  symbolPreview: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: UI_COLORS.buttonBorder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolImage: {
    width: 56,
    height: 56,
  },
  noSymbol: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  symbolActions: {
    gap: 4,
  },
  smallAction: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: UI_COLORS.barBorder,
  },
  smallActionText: {
    fontSize: 13,
    fontWeight: '600',
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
