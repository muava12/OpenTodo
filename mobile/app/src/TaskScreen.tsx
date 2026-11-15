// The task detail screen (OpenSpec change rn-taskito-foundation, tasks 5.1, 5.3):
// the title and notes in place, the field rows, each opening its picker (the
// pickers land with task 5.2; the rows show the value), and a back to the list.
// The reminders row opens the reminder sheet (task 5.3).
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { useState } from 'react'
import { fieldRows, collapses, type FieldRow } from './fields'
import { palette } from './ui/tokens'
import { ReminderSheet, type ReminderInput } from './ReminderSheet'
import type { Reminder, Task } from '@shared/types'

const LABELS: Record<FieldRow['kind'], string> = {
  when: 'When',
  deadline: 'Deadline',
  project: 'Project',
  labels: 'Labels',
  priority: 'Priority',
  reminders: 'Reminders',
  repeat: 'Repeat',
}

interface Props {
  task: Task
  reminders?: Reminder[]
  onBack: () => void
  onAddReminder?: (input: ReminderInput) => void
  onDeleteReminder?: (id: string) => void
}

export default function TaskScreen({ task, reminders = [], onBack, onAddReminder, onDeleteReminder }: Props) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const rows = fieldRows(task, reminders)
  const collapsed = collapses(rows)
  const [reminderSheet, setReminderSheet] = useState(false)

  const handleAddReminder = (input: ReminderInput) => {
    onAddReminder?.(input)
    setReminderSheet(false)
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={[styles.back, { color: c.accent }]}>Back</Text>
        </Pressable>
      </View>
      <ScrollView>
        <Text style={[styles.title, { color: c.text }]}>{task.title}</Text>
        {task.description ? (
          <Text style={[styles.notes, { color: c.textSecondary }]}>{task.description}</Text>
        ) : null}
        {collapsed ? (
          <Text style={[styles.add, { color: c.textSecondary }]}>Add…</Text>
        ) : (
          rows.filter((r) => r.value !== '').map((r) =>
            r.kind === 'reminders' && onAddReminder ? (
              <Pressable key={r.kind} style={styles.field} onPress={() => setReminderSheet(true)}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{LABELS[r.kind]}</Text>
                <Text style={[styles.fieldValue, { color: c.accent }]}>{r.value}</Text>
              </Pressable>
            ) : (
              <View key={r.kind} style={styles.field}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{LABELS[r.kind]}</Text>
                <Text style={[styles.fieldValue, { color: c.text }]}>{r.value}</Text>
              </View>
            ),
          )
        )}
        {/* When collapsed, the reminders row is hidden. Show an "Add reminder" button. */}
        {collapsed && onAddReminder && (
          <Pressable style={styles.field} onPress={() => setReminderSheet(true)}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{LABELS.reminders}</Text>
            <Text style={[styles.fieldValue, { color: c.accent }]}>Add…</Text>
          </Pressable>
        )}
      </ScrollView>
      {reminderSheet && onAddReminder && (
        <ReminderSheet
          task={task}
          reminders={reminders}
          onAdd={handleAddReminder}
          onDelete={onDeleteReminder}
          onClose={() => setReminderSheet(false)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  back: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 24 },
  notes: { fontSize: 15, paddingHorizontal: 24, paddingTop: 8 },
  field: { borderBottomWidth: 1, flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingVertical: 12 },
  fieldLabel: { flex: 1, fontSize: 15 },
  fieldValue: { flex: 1, fontSize: 15 },
  add: { fontSize: 15, paddingHorizontal: 24, paddingVertical: 12 },
})