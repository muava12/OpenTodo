// The Today screen (OpenSpec change rn-taskito-foundation, task 1.3): the
// native list of today's rows, each with a checkbox that completes the task with
// a haptic, as the trial the foundation promised. The rows come from the shared
// todayTasks (src/today.ts); this screen draws them and reloads on a change.
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { todayRows, type TodayRow } from './today'

const palette = {
  light: { bg: '#ffffff', text: '#1c1c1e', muted: '#6e6e73', field: '#f2f2f7', accent: '#0a66d8', error: '#c4281c' },
  dark: { bg: '#000000', text: '#f5f5f7', muted: '#98989d', field: '#1c1c1e', accent: '#4c9bff', error: '#ff6b5e' },
}

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
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.field }]}
    >
      <View style={[styles.check, { borderColor: c.accent }]} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.text }]}>{row.task.title}</Text>
      </View>
      {!last && <View style={[styles.thread, { backgroundColor: c.accent }]} />}
    </Pressable>
  )
}

export default function TodayScreen({ onSignOut }: { onSignOut: () => void }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const { rows, loaded, complete } = useTodayRows()

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Today</Text>
        <Pressable accessibilityRole="button" onPress={onSignOut} hitSlop={12}>
          <Text style={[styles.signOut, { color: c.muted }]}>Sign out</Text>
        </Pressable>
      </View>
      {loaded && rows.length === 0 ? (
        <Text style={[styles.empty, { color: c.muted }]}>Nothing due today.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.task.id}
          renderItem={({ item, index }) => <Row row={item} onComplete={complete} last={index === rows.length - 1} />}
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
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48, paddingHorizontal: 24 },
  check: { borderRadius: 12, borderWidth: 2, height: 24, width: 24 },
  text: { flex: 1 },
  thread: { bottom: 0, left: 35, position: 'absolute', top: 40, width: 2 },
  empty: { fontSize: 15, paddingHorizontal: 24, paddingTop: 16 },
})