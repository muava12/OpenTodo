// The notification settings screen (OpenSpec change rn-taskito-foundation,
// task 6.2): the user choices in Settings → Notifications. "Create tasks
// from notification", "Show snooze option" with a length, "Show Done action",
// and the custom sound through the silent-twin channel.
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { palette } from './ui/tokens'
import { Switch } from './ui/Switch'
import {
  DEFAULT_NOTIFICATION_PREFS,
  SNOOZE_LENGTH_LABELS,
  type NotificationPrefs,
  type SnoozeLength,
} from './notifPrefs'

interface Props {
  prefs: NotificationPrefs
  onChange: (prefs: NotificationPrefs) => void
  onBack?: () => void
}

const SNOOZE_OPTIONS: SnoozeLength[] = ['10m', '1h', 'tomorrow']

/**
 * The notification settings screen. Each row is a toggle or a picker.
 * Changes are written immediately through onChange.
 */
export default function NotificationSettingsScreen({ prefs, onChange, onBack }: Props) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']

  const set = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) =>
    onChange({ ...prefs, [key]: value })

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {onBack && (
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
            <Text style={[styles.back, { color: c.accent }]}>Back</Text>
          </Pressable>
        </View>
      )}
      <ScrollView>
        <Text style={[styles.heading, { color: c.text }]}>Notifications</Text>

        {/* Create tasks from notification */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.label, { color: c.text }]}>Create tasks from notification</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Show a sticky notification that opens quick-add.
            </Text>
          </View>
          <Switch
            checked={prefs.captureEnabled}
            onCheckedChange={(v) => set('captureEnabled', v)}
          />
        </View>

        {/* Show Done action */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.label, { color: c.text }]}>Show Done action</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Show a Done button on reminder notifications.
            </Text>
          </View>
          <Switch
            checked={prefs.showDone}
            onCheckedChange={(v) => set('showDone', v)}
          />
        </View>

        {/* Show snooze option */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.label, { color: c.text }]}>Show snooze option</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Show a Snooze button on reminder notifications.
            </Text>
          </View>
          <Switch
            checked={prefs.showSnooze}
            onCheckedChange={(v) => set('showSnooze', v)}
          />
        </View>

        {/* Snooze length (only when snooze is on) */}
        {prefs.showSnooze && (
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={[styles.label, { color: c.text }]}>Snooze length</Text>
            </View>
            <View style={styles.picker}>
              {SNOOZE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.pickerOption,
                    prefs.snoozeLength === opt && { backgroundColor: c.accent },
                  ]}
                  onPress={() => set('snoozeLength', opt)}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      { color: prefs.snoozeLength === opt ? '#fff' : c.text },
                    ]}
                  >
                    {SNOOZE_LENGTH_LABELS[opt]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Custom sound */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.label, { color: c.text }]}>Custom sound</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Play a custom sound through the silent-twin channel.
            </Text>
          </View>
          <Switch
            checked={prefs.customSound}
            onCheckedChange={(v) => set('customSound', v)}
          />
        </View>

        {/* Reset to defaults */}
        <Pressable
          style={styles.reset}
          onPress={() => onChange({ ...DEFAULT_NOTIFICATION_PREFS })}
        >
          <Text style={[styles.resetText, { color: c.textSecondary }]}>Reset to defaults</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  back: { fontSize: 15, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '700', paddingHorizontal: 24, paddingBottom: 16 },
  row: { borderBottomWidth: 1, flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingVertical: 16 },
  rowLabel: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500' },
  description: { fontSize: 13, marginTop: 4 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pickerOption: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  pickerText: { fontSize: 15 },
  reset: { paddingHorizontal: 24, paddingVertical: 24 },
  resetText: { fontSize: 15, textAlign: 'center' },
})