// A list screen over the shared selectors (OpenSpec change
// rn-taskito-foundation, task 3.1): the same row as Today's — a checkbox, the
// title, the thread — over the Inbox or the next 14 days. The drawing is the
// screen's; the rows come from src/lists.ts.
import { useCallback, useEffect, useState } from 'react'
import { LegendList } from '@legendapp/list'
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { inboxRows, upcomingRows, type Row } from './lists'
import { palette } from './ui/tokens'

const paletteOf = (scheme: 'light' | 'dark') => palette[scheme]

/** Today's date on the device, as the shared modules write it. */
function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The rows of a list, reloaded when it mounts and after a completion. */
export function useRows(kind: 'inbox' | 'upcoming') {
  const [rows, setRows] = useState<Row[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    const next = kind === 'inbox' ? await inboxRows() : await upcomingRows(today())
    setRows(next)
    setLoaded(true)
  }, [kind])

  useEffect(() => { void reload() }, [reload])

  const complete = useCallback(async (row: Row) => {
    await row.complete()
    await reload()
  }, [reload])

  return { rows, loaded, complete }
}

/** One row: a 24 px circle with a 44 px target, the title, and the thread's line. */
function RowView({ row, onComplete, last, scheme }: { row: Row; onComplete: (r: Row) => void; last: boolean; scheme: 'light' | 'dark' }) {
  const c = paletteOf(scheme)
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

/** The Inbox or Upcoming list. */
export default function ListScreen({ kind }: { kind: 'inbox' | 'upcoming' }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const c = paletteOf(scheme)
  const { rows, loaded, complete } = useRows(kind)
  const title = kind === 'inbox' ? 'Inbox' : 'Upcoming'

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {loaded && rows.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>Nothing here.</Text>
      ) : (
        <LegendList
          data={rows}
          keyExtractor={(r) => r.task.id}
          renderItem={({ item, index }) => <RowView row={item} onComplete={complete} last={index === rows.length - 1} scheme={scheme} />}
          recycleItems
          estimatedItemSize={48}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48, paddingHorizontal: 24 },
  check: { borderRadius: 12, borderWidth: 2, height: 24, width: 24 },
  text: { flex: 1 },
  thread: { bottom: 0, left: 35, position: 'absolute', top: 40, width: 2 },
  empty: { fontSize: 15, paddingHorizontal: 24, paddingTop: 16 },
})