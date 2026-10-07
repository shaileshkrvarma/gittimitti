import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native'

export const colors = { primary: '#1b5e20', danger: '#c62828', muted: '#666', border: '#ddd' }

export function Button({ title, onPress, disabled, variant = 'primary' }: {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'danger' | 'outline'
}) {
  const bg = variant === 'outline' ? 'transparent' : variant === 'danger' ? colors.danger : colors.primary
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, variant === 'outline' && styles.outline]}
    >
      <Text style={[styles.buttonText, variant === 'outline' && { color: colors.primary }]}>{title}</Text>
    </Pressable>
  )
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor="#999" autoCapitalize="none" {...props} style={[styles.input, props.style]} />
}

export function ErrorText({ message }: { message: string }) {
  return message ? <Text style={styles.error}>{message}</Text> : null
}

export const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
  button: { padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 6 },
  outline: { borderWidth: 1, borderColor: colors.primary },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginVertical: 6, color: '#000' },
  error: { color: colors.danger, marginVertical: 6 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  muted: { color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
