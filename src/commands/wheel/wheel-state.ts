import type { WheelConfig, WheelEntry } from '../../types.ts'

export interface SpinState {
  wheelConfig: WheelConfig
  imageFormat: 'gif' | 'webp'
  winner: WheelEntry
  spoiler: boolean
  userId: string
}

const states = new Map<string, SpinState>()
const MAX_STATES = 200

export function saveSpinState(state: SpinState): string {
  if (states.size >= MAX_STATES) {
    const firstKey = states.keys().next().value
    if (firstKey) states.delete(firstKey)
  }
  const key = generateKey()
  states.set(key, state)
  return key
}

export function getSpinState(key: string): SpinState | undefined {
  return states.get(key)
}

function generateKey(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
