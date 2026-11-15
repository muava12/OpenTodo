// The Today screen (OpenSpec change rn-taskito-foundation, task 1.3): the
// native list of today's rows, each with a checkbox that completes the task with
// a haptic, as the trial the foundation promised. The rows come from the shared
// todayRows (src/today.ts); this screen draws them and reloads on a change.
// The bottom bar (task 4.1, OpenJot design) has three states: idle, compact
// (scrolled), and active (typing).
import { useCallback, useEffect, useRef, useState } from 'react'
import { LegendList } from '@legendapp/list'
import { Pressable, RefreshControl, Keyboard, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { todayRows, type TodayRow } from './today'
import { counts } from './counts'
import { palette } from './ui/tokens'
import { statusLine } from './syncStatus'
import { bottomPadding } from './padding'
import { parseLine } from './parseLine'
import { taskFrom } from './taskFrom'
import TaskScreen from './TaskScreen'
import BottomBar, { type BarState } from './BottomBar'
import { createTask } from '@shared/ops'
import { requestSync, useSyncStatus } from '@shared/sync'

/** The grace period of a completion, in ms (design D3). */
const GRACE_MS = 5_000
/** The scroll offset that triggers the compact bar. */
const SCROLL_THRESHOLD = 10

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
  const [undo, setUndo] = useState<null | { row: TodayRow; until: number }>(null)

  const reload = useCallback(async () => {
    const next = await todayRows(today())
    setRows(next)
    setLoaded(true)
  }, [])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    if (!undo) return
    const ms = undo.until - Date.now()
    if (ms <= 0) { setUndo(null); void reload(); return }
    const t = setTimeout(() => { setUndo(null); void reload() }, ms)
    return () => clearTimeout(t)
  }, [undo, reload])

  const complete = useCallback(async (row: TodayRow) => {
    await row.complete()
    setRows((rs) => rs.filter((r) => r.task.id !== row.task.id))
    setUndo({ row, until: Date.now() + GRACE_MS })
  }, [])

  const undoComplete = useCallback(async () => {
    if (!undo) return
    await undo.row.reopen()
    setUndo(null)
    await reload()
  }, [undo, reload])

  return { rows, loaded, complete, undo, undoComplete, reload }
}

/** One row: a 24 px circle with a 44 px target, the title, the thread's line, and the open. */
function Row({ row, onComplete, last, onOpen }: { row: TodayRow; onComplete: (r: TodayRow) => void; last: boolean; onOpen: (r: TodayRow) => void }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  return (
    <View style={[styles.rowWrap, { backgroundColor: c.background }]}>
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
      <Pressable accessibilityRole="button" onPress={() => onOpen(row)} hitSlop={8} style={styles.open}>
        <Text style={[styles.openText, { color: c.textSecondary }]}>Open</Text>
      </Pressable>
    </View>
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
  const { rows, loaded, complete, undo, undoComplete, reload } = useTodayRows()
  const sync = useSyncStatus()
  const [refreshing, setRefreshing] = useState(false)
  const [keyboardUp, setKeyboardUp] = useState(false)
  const [open, setOpen] = useState<TodayRow | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<number>(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false))
    return () => { show.remove(); hide.remove() }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    requestSync(0)
    await reload()
    setRefreshing(false)
  }, [reload])

  const line = statusLine(sync)
  const [text, setText] = useState('')
  const submit = useCallback(async () => {
    const line = text.trim()
    if (!line) return
    const parsed = parseLine(line, { today: today(), projects: [] })
    await createTask(taskFrom(parsed, { today: today() }))
    setText('')
    await reload()
  }, [text, reload])

  // The bar state: active when keyboard is up and text has content;
  // compact when scrolled; idle otherwise.
  const barState: BarState = keyboardUp && text.length > 0 ? 'active' : scrolled ? 'compact' : 'idle'

  if (open) return <TaskScreen task={open.task} onBack={() => setOpen(null)} />

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Today</Text>
        <Pressable accessibilityRole="button" onPress={onSignOut} hitSlop={12}>
          <Text style={[styles.signOut, { color: c.textSecondary }]}>Sign out</Text>
        </Pressable>
      </View>
      {loaded && <CountCards rows={rows} />}
      {line ? <Text style={[styles.status, { color: c.textSecondary }]}>{line}</Text> : null}
      {loaded && rows.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>Nothing due today.</Text>
      ) : (
        <LegendList
          data={rows}
          keyExtractor={(r) => r.task.id}
          renderItem={({ item, index }) => <Row row={item} onComplete={complete} last={index === rows.length - 1} onOpen={setOpen} />}
          recycleItems
          estimatedItemSize={48}
          contentContainerStyle={{ paddingBottom: bottomPadding({ keyboard: keyboardUp, barHeight: 62 }) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          onScroll={(e) => {
            scrollRef.current = e.nativeEvent.contentOffset.y
            setScrolled(scrollRef.current > SCROLL_THRESHOLD)
          }}
          onMomentumScrollEnd={(e) => {
            scrollRef.current = e.nativeEvent.contentOffset.y
            setScrolled(scrollRef.current > SCROLL_THRESHOLD)
          }}
        />
      )}
      {undo && (
        <Pressable accessibilityRole="button" onPress={() => void undoComplete()} style={[styles.undo, { backgroundColor: c.surface }]}>
          <Text style={[styles.undoText, { color: c.text }]}>Undo</Text>
        </Pressable>
      )}
      <BottomBar
        state={barState}
        text={text}
        onChangeText={setText}
        onAdd={() => void submit()}
        onClear={() => setText('')}
        onDone={() => void submit()}
      />
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
  row: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12, minHeight: 48, paddingHorizontal: 24 },
  rowWrap: { flexDirection: 'row', minHeight: 48 },
  open: { justifyContent: 'center', paddingHorizontal: 16 },
  openText: { fontSize: 13, fontWeight: '600' },
  check: { borderRadius: 12, borderWidth: 2, height: 24, width: 24 },
  text: { flex: 1 },
  thread: { bottom: 0, left: 35, position: 'absolute', top: 40, width: 2 },
  empty: { fontSize: 15, paddingHorizontal: 24, paddingTop: 16 },
  status: { fontSize: 13, paddingHorizontal: 24, paddingBottom: 4 },
  undo: { borderRadius: 12, bottom: 80, marginHorizontal: 24, paddingHorizontal: 16, paddingVertical: 12, position: 'absolute' },
  undoText: { fontSize: 15, fontWeight: '600' },
})