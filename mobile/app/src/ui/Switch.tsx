// A native Switch component for the RN app (OpenSpec change
// rn-taskito-foundation). Wraps the platform Switch with the app's tokens.
import { Switch as RNSwitch, useColorScheme } from 'react-native'
import { palette } from './tokens'

interface Props {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** A toggle switch using the platform's native control. */
export function Switch({ checked, onCheckedChange, disabled }: Props) {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light']
  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: c.textSecondary, true: c.accent }}
      thumbColor="#fff"
    />
  )
}