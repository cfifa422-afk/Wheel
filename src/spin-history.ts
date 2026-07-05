export interface SpinRecord {
  timestamp: number
  subcommand: string
  entryCount: number
  guildId: string | null
}

const MAX_HISTORY = 10
const history: SpinRecord[] = []

export function recordSpin(record: SpinRecord) {
  history.unshift(record)
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
}

export function getSpinHistory(): readonly SpinRecord[] {
  return history
}
