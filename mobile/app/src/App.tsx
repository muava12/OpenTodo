// The app's start (OpenSpec change rn-taskito-foundation, tasks 1.1–1.3): the
// server screen, then sign-in through the system sheet, then the token storage.
// The list screens follow in section 2; until they exist a signed-in account shows
// its address and its version, as the trial the foundation shipped.
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Linking, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native'
import { checkServer, UPDATE_GUIDE, type ServerCheck } from './server'
import { signIn } from './nativeAuth'
import { tokens } from './nativeAuth'
import { startAccount, stopAccount } from './account'
import type { Tokens } from './signIn'

const palette = {
  light: { bg: '#ffffff', text: '#1c1c1e', muted: '#6e6e73', field: '#f2f2f7', accent: '#0a66d8', error: '#c4281c' },
  dark: { bg: '#000000', text: '#f5f5f7', muted: '#98989d', field: '#1c1c1e', accent: '#4c9bff', error: '#ff6b5e' },
}

/** What the app knows of the account it is signed in to. */
interface Account {
  server: string
  version: string
  tokens: Tokens
}

export default function App() {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ServerCheck | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [signInProblem, setSignInProblem] = useState<string | null>(null)

  // On start, if a pair is stored, the account is already signed in; show it.
  useEffect(() => {
    void (async () => {
      const stored = await tokens.load()
      if (stored) setAccount({ server: address, version: '', tokens: stored })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setSignInProblem(null)
    const r = await checkServer(address)
    setResult(r)
    if (r.ok) {
      const s = await signIn({ server: r.url })
      if (s.ok) {
        setAccount({ server: r.url, version: r.version, tokens: s.tokens })
        await startAccount(r.url)
      } else setSignInProblem(s.problem)
    }
    setBusy(false)
  }, [address, busy])

  const signOut = useCallback(async () => {
    await stopAccount()
    await tokens.clear()
    setAccount(null)
    setResult(null)
  }, [])

  if (account) {
    return (
      <View style={[styles.screen, styles.body, { backgroundColor: c.bg }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Signed in</Text>
        <Text style={[styles.note, { color: c.muted }]}>{account.server}</Text>
        {account.version ? <Text style={[styles.note, { color: c.muted }]}>OpenTodo {account.version}</Text> : null}
        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.button, { backgroundColor: c.accent, opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.body}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>Your server</Text>
        <TextInput
          accessibilityLabel="Server address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          editable={!busy}
          inputMode="url"
          keyboardType="url"
          onChangeText={(s) => { setAddress(s); setResult(null); setSignInProblem(null) }}
          onSubmitEditing={submit}
          placeholder="todo.example.com"
          placeholderTextColor={c.muted}
          returnKeyType="go"
          style={[styles.field, { backgroundColor: c.field, color: c.text }]}
          textContentType="URL"
          value={address}
        />
        {result && !result.ok && (
          <View accessibilityLiveRegion="polite">
            <Text style={[styles.note, { color: c.error }]}>{result.message}</Text>
            {result.problem === 'needs-update' && (
              <Text accessibilityRole="link" onPress={() => Linking.openURL(UPDATE_GUIDE)} style={[styles.note, { color: c.accent }]}>
                How to update the server
              </Text>
            )}
          </View>
        )}
        {signInProblem && <Text style={[styles.note, { color: c.error }]}>{signInProblem}</Text>}
        {result?.ok && <Text style={[styles.note, { color: c.muted }]}>OpenTodo {result.version}</Text>}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy || !address.trim() }}
          disabled={busy || !address.trim()}
          onPress={submit}
          style={({ pressed }) => [styles.button, { backgroundColor: c.accent, opacity: pressed || !address.trim() ? 0.6 : 1 }]}
        >
          {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  title: { fontSize: 34, fontWeight: '700', marginBottom: 8 },
  field: { borderRadius: 12, fontSize: 17, paddingHorizontal: 16, paddingVertical: 14 },
  note: { fontSize: 15, lineHeight: 20 },
  button: { alignItems: 'center', borderRadius: 12, marginTop: 8, paddingVertical: 15 },
  buttonText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
})