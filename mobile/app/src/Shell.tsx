// The app's shell (OpenSpec change rn-taskito-foundation, design D1): four tabs.
// The tab bar is the platform's (react-native-bottom-tabs); each tab's screen is
// its own native stack (react-native-screens via @react-navigation/native-stack).
// Today shows the Today screen; the other three tabs are placeholders until
// their screens land (section 2).
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import TabView, { SceneMap } from 'react-native-bottom-tabs'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import TodayScreen from './TodayScreen'
import ListScreen from './ListScreen'
import { TABS } from './navigation'
import { palette } from './ui/tokens'

const Stack = createNativeStackNavigator()

/** A placeholder screen until the tab's own screen lands. */
function Placeholder({ name }: { name: string }) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <Text style={[styles.placeholder, { color: c.textSecondary }]}>{name}</Text>
    </View>
  )
}

function StackOf({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={name}>{() => children}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

/** The four tabs over their stacks. */
export default function Shell({ onSignOut }: { onSignOut: () => void }) {
  return (
    <TabView
      navigationState={{ index: 0, routes: TABS.map((t) => ({ key: t.route, name: t.route })) }}
      onIndexChange={() => undefined}
      renderScene={SceneMap({
        today: () => <StackOf name="today"><TodayScreen onSignOut={onSignOut} /></StackOf>,
        inbox: () => <StackOf name="inbox"><ListScreen kind="inbox" /></StackOf>,
        upcoming: () => <StackOf name="upcoming"><ListScreen kind="upcoming" /></StackOf>,
        browse: () => <StackOf name="browse"><Placeholder name="Browse" /></StackOf>,
      })}
    />
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  placeholder: { fontSize: 16 },
})