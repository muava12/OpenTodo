// The bottom capture bar (OpenSpec change rn-taskito-foundation, task 4.1
// + design from OpenJot canvas Iv5IzAaYgY). Three states:
//   idle     — glass pill with search icon and "Add a task…" placeholder, FAB on the right
//   compact  — when scrolled: two circular buttons (search + FAB), no pill
//   active   — when typing: glass pill with typed text + clear button, "Done" on the right
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native'
import { palette } from './ui/tokens'

export type BarState = 'idle' | 'compact' | 'active'

interface Props {
  /** The current state. */
  state: BarState
  /** The typed text (active state only). */
  text: string
  /** The placeholder (idle state only). */
  placeholder?: string
  /** Called when the user types. */
  onChangeText: (text: string) => void
  /** Called when the user taps the FAB or presses Enter. */
  onAdd: () => void
  /** Called when the user clears the text. */
  onClear?: () => void
  /** Called when the user taps Done. */
  onDone?: () => void
}

/**
 * The bottom capture bar with three visual states (OpenJot design):
 * - idle: glass pill with search icon + placeholder, FAB button
 * - compact: two circular buttons (search + FAB), no text
 * - active: glass pill with typed text + clear button, "Done" button
 */
export default function BottomBar({
  state,
  text,
  placeholder = 'Add a task…',
  onChangeText,
  onAdd,
  onClear,
  onDone,
}: Props) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']

  // COMPACT: two circular buttons, no pill
  if (state === 'compact') {
    return (
      <View style={styles.dock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={[styles.circle, { backgroundColor: c.glass, borderColor: c.glassEdge }]}
        >
          <Text style={[styles.circleIcon, { color: c.textSecondary }]}>{'\u{1F50D}'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a task"
          onPress={onAdd}
          style={[styles.circle, styles.circleFab, { backgroundColor: c.fabFill }]}
        >
          <Text style={[styles.circleIcon, { color: c.fabIcon }]}>+</Text>
        </Pressable>
      </View>
    )
  }

  // IDLE or ACTIVE: glass pill
  const active = state === 'active'
  const pillBg = active ? c.glassFocus : c.glass
  const pillBorder = active ? c.glassEdgeFocus : c.glassEdge

  return (
    <View style={styles.dock}>
      {/* The glass pill */}
      <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
        <Text style={[styles.pillIcon, { color: c.textSecondary }]}>{'\u{1F50D}'}</Text>
        <TextInput
          accessibilityLabel="Add a task"
          style={[styles.pillInput, { color: c.text }]}
          onChangeText={onChangeText}
          onSubmitEditing={() => active ? onDone?.() : onAdd()}
          placeholder={placeholder}
          placeholderTextColor={c.textSecondary}
          returnKeyType="done"
          value={text}
        />
        {active && text.length > 0 && onClear && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={onClear} hitSlop={8}>
            <Text style={[styles.clear, { color: c.textSecondary }]}>×</Text>
          </Pressable>
        )}
      </View>

      {/* The right-side button: FAB (idle) or "Done" pill (active) */}
      {active ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={() => { onDone?.(); onClear?.() }}
          style={[styles.pillSmall, { backgroundColor: c.glass, borderColor: c.glassEdge }]}
        >
          <Text style={[styles.pillText, { color: c.text }]}>Done</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a task"
          onPress={onAdd}
          style={[styles.circle, styles.circleFab, { backgroundColor: c.fabFill }]}
        >
          <Text style={[styles.circleIcon, { color: c.fabIcon }]}>+</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  dock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    paddingHorizontal: 16,
  },
  pillSmall: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pillIcon: { fontSize: 16 },
  pillInput: { flex: 1, fontSize: 15 },
  pillText: { fontSize: 15, fontWeight: '600' },
  clear: { fontSize: 18, fontWeight: '700' },
  circle: {
    alignItems: 'center',
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  circleFab: {
    // The FAB stands out: no border, solid fill
    borderWidth: 0,
  },
  circleIcon: { fontSize: 18 },
})