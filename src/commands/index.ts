import wheel from './wheel/index.ts'
import statistics from './statistics.ts'
import type { Command } from '../types.ts'

const commands: Record<string, Command> = { wheel, statistics }

export default commands
