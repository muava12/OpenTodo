// The Today screen (OpenSpec change rn-taskito-foundation, task 1.3): the
// native list of today's rows, each with a checkbox that completes the task with
// a haptic, as the trial the foundation promised. The rows come from the shared
// todayTasks (src/today.ts); this screen draws them and reloads on a change.
import { useCallback, useEffect, useState } from 'react'
import { LegendList } from '@legendapp/list'
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { todayRows, type TodayRow } from './today'
import { counts } from './counts'
import { palette } from './ui/tokens'

/** Today's date on the device, as the shared modules write it. */
function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The rows, reloaded when the screen mounts and after a completion. */
export function useTodayRows() {
  const [rows, setRows] = useState<TodayRow[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    const next = await todayRows(today())
    setRows(next)
    setLoaded(true)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const complete = useCallback(async (row: TodayRow) => {
    await row.complete()
    await reload()
  }, [reload])

  return { rows, loaded, complete }
}

/** One row: a 24 px circle with a 44 px target, the title, and the thread's line. */
function Row({ row, onComplete, last }: { row: TodayRow; onComplete: (r: TodayRow) => void; last: boolean }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: false }}
      onPress={() => onComplete(row)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surface }]}
    >
      <View style={[styles.check, { borderColor: c.accent }]} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.text }]}>{row.task.title}</Text>
      </View>
      {!last && <View style={[styles.thread, { backgroundColor: c.accent }]} />}
    </Pressable>
  )
}

/** The three count cards (design D2): Remaining, Overdue, Unplanned. */
function CountCards({ rows }: { rows: TodayRow[] }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const k = counts(rows.map((r) => ({ task: r.task })), today())
  const card = (label: string, n: number) => (
    <View key={label} style={[styles.card, { backgroundColor: c.surface }]}>
      <Text style={[styles.cardCount, { color: c.text }]}>{n}</Text>
      <Text style={[styles.cardLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  )
  return (
    <View style={styles.cards}>
      {card('Remaining', k.remaining)}
      {card('Overdue', k.overdue)}
      {card('Unplanned', k.unplanned)}
    </View>
  )
}

export default function TodayScreen({ onSignOut }: { onSignOut: () => void }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const { rows, loaded, complete } = useTodayRows()

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Today</Text>
        <Pressable accessibilityRole="button" onPress={onSignOut} hitSlop={12}>
          <Text style={[styles.signOut, { color: c.textSecondary }]}>Sign out</Text>
        </Pressable>
      </View>
      {loaded && <CountCards rows={rows} />}
      {loaded && rows.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>Nothing due today.</Text>
      ) : (
        <LegendList
          data={rows}
          keyExtractor={(r) => r.task.id}
          renderItem={({ item, index }) => <Row row={item} onComplete={complete} last={index === rows.length - 1} />}
          recycleItems
          estimatedItemSize={48}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700' },
  signOut: { fontSize: 15 },
  cards: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 8 },
  card: { borderRadius: 12, flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  cardCount: { fontSize: 22, fontWeight: '700' },
  cardLabel: { fontSize: 11 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48, paddingHorizontal: 24 },
  check: { borderRadius: 12, borderWidth: 2, height: 24, width: 24 },
  text: { flex: 1 },
  thread: { bottom: 0, left: 35, position: 'absolute', top: 40, width: 2 },
  empty: { fontSize: 15, paddingHorizontal: 24, paddingTop: 16 },
})