// The reminder sheet (OpenSpec change rn-taskito-foundation, task 5.3):
// a native bottom sheet that lets the user pick a reminder for a task.
// Offers relative presets, a custom offset, an absolute date and time,
// and the default reminders from the user's preferences.
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native'
import { useState } from 'react'
import { palette } from './ui/tokens'
import {
  RELATIVE_PRESETS,
  DEADLINE_PRESETS,
  DEFAULT_REMINDER_TIME,
  offsetLabel,
} from './reminders'
import type { Reminder, Task } from '@shared/types'

/** The input the sheet produces: a reminder to add. */
export interface ReminderInput {
  kind: 'relative' | 'deadline' | 'absolute'
  offset_minutes?: number
  fire_at?: number
}

interface Props {
  task: Task
  /** The existing reminders on this task (for the list). */
  reminders?: Reminder[]
  /** Called when the user picks a reminder. */
  onAdd: (input: ReminderInput) => void
  /** Called when the user deletes a reminder. */
  onDelete?: (id: string) => void
  /** Called when the sheet is dismissed without adding. */
  onClose: () => void
}

type Mode = 'menu' | 'custom' | 'absolute'

/**
 * The reminder sheet. Shows the existing reminders as chips, an "Add reminder"
 * button that opens the menu of presets, and the custom and absolute editors.
 */
export function ReminderSheet({ task, reminders = [], onAdd, onDelete, onClose }: Props) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const [mode, setMode] = useState<Mode>('menu')
  const [amount, setAmount] = useState('30')
  const [unit, setUnit] = useState<'1' | '60' | '1440'>('1')
  const [direction, setDirection] = useState<'before' | 'after'>('before')
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [time, setTime] = useState(DEFAULT_REMINDER_TIME)

  const live = reminders.filter((r) => !r.deleted_at)

  const saveRelative = (minutes: number) => {
    onAdd({ kind: 'relative', offset_minutes: minutes })
  }

  const saveCustom = () => {
    const n = parseInt(amount, 10)
    if (isNaN(n) || n < 0) return
    const minutes = n * Number(unit)
    saveRelative(direction === 'before' ? -minutes : minutes)
  }

  const saveAbsolute = () => {
    const at = new Date(`${date}T${time}`).getTime()
    if (isNaN(at)) return
    onAdd({ kind: 'absolute', fire_at: at })
  }

  const saveDeadline = (minutes: number) => {
    onAdd({ kind: 'deadline', offset_minutes: minutes })
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={[styles.handle, { backgroundColor: c.textSecondary }]} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.heading, { color: c.text }]}>Reminders</Text>

          {/* Existing reminders as chips */}
          {live.length > 0 && (
            <View style={styles.chips}>
              {live.map((r) => (
                <View key={r.id} style={[styles.chip, { borderColor: c.textSecondary }]}>
                  <Text style={[styles.chipText, { color: c.text }]}>
                    {r.kind === 'relative'
                      ? offsetLabel(r.offset_minutes)
                      : r.kind === 'deadline'
                        ? 'Deadline'
                        : new Date(r.fire_at!).toLocaleString()}
                  </Text>
                  {onDelete && (
                    <Pressable onPress={() => onDelete(r.id)} hitSlop={8}>
                      <Text style={[styles.chipRemove, { color: c.textSecondary }]}>×</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          {mode === 'menu' && (
            <>
              {/* Relative presets */}
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Before the due time</Text>
              {RELATIVE_PRESETS.map((p) => (
                <Pressable key={p.minutes} style={styles.row} onPress={() => saveRelative(p.minutes)}>
                  <Text style={[styles.rowText, { color: c.text }]}>{p.label}</Text>
                </Pressable>
              ))}

              {/* Deadline presets (only when the task has a deadline) */}
              {task.deadline && (
                <>
                  <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Before the deadline</Text>
                  {DEADLINE_PRESETS.map((p) => (
                    <Pressable key={p.minutes} style={styles.row} onPress={() => saveDeadline(p.minutes)}>
                      <Text style={[styles.rowText, { color: c.text }]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              {/* Custom offset */}
              <Pressable style={styles.row} onPress={() => setMode('custom')}>
                <Text style={[styles.rowText, { color: c.accent }]}>Custom…</Text>
              </Pressable>

              {/* Absolute time */}
              <Pressable style={styles.row} onPress={() => setMode('absolute')}>
                <Text style={[styles.rowText, { color: c.accent }]}>At a time…</Text>
              </Pressable>
            </>
          )}

          {mode === 'custom' && (
            <View style={styles.editor}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Custom offset</Text>
              <View style={styles.editorRow}>
                <TextInput
                  style={[styles.input, { borderColor: c.textSecondary, color: c.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={c.textSecondary}
                />
                <Pressable style={styles.pickerButton} onPress={() => setUnit(unit === '1' ? '60' : unit === '60' ? '1440' : '1')}>
                  <Text style={[styles.pickerButtonText, { color: c.text }]}>
                    {unit === '1' ? 'minutes' : unit === '60' ? 'hours' : 'days'}
                  </Text>
                </Pressable>
                <Pressable style={styles.pickerButton} onPress={() => setDirection(direction === 'before' ? 'after' : 'before')}>
                  <Text style={[styles.pickerButtonText, { color: c.text }]}>
                    {direction}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.editorActions}>
                <Pressable style={[styles.button, { backgroundColor: c.accent }]} onPress={saveCustom}>
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
                <Pressable style={styles.buttonSecondary} onPress={() => setMode('menu')}>
                  <Text style={[styles.buttonSecondaryText, { color: c.textSecondary }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'absolute' && (
            <View style={styles.editor}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>At a time</Text>
              <TextInput
                style={[styles.input, { borderColor: c.textSecondary, color: c.text }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.textSecondary}
              />
              <TextInput
                style={[styles.input, { borderColor: c.textSecondary, color: c.text }]}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={c.textSecondary}
              />
              <View style={styles.editorActions}>
                <Pressable style={[styles.button, { backgroundColor: c.accent }]} onPress={saveAbsolute}>
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
                <Pressable style={styles.buttonSecondary} onPress={() => setMode('menu')}>
                  <Text style={[styles.buttonSecondaryText, { color: c.textSecondary }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  handle: { alignSelf: 'center', borderRadius: 2, height: 4, marginVertical: 8, width: 40 },
  content: { padding: 24, paddingTop: 8 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 14 },
  chipRemove: { fontSize: 18, fontWeight: '700' },
  row: { paddingVertical: 12 },
  rowText: { fontSize: 16 },
  editor: { marginTop: 16 },
  editorRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  input: { borderRadius: 8, borderWidth: 1, flex: 1, fontSize: 16, padding: 12 },
  pickerButton: { paddingHorizontal: 12, paddingVertical: 12 },
  pickerButtonText: { fontSize: 16 },
  editorActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: { borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonSecondary: { paddingHorizontal: 24, paddingVertical: 12 },
  buttonSecondaryText: { fontSize: 16 },
})