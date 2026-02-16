import list from './list.ts'
import members from './members.ts'
import reactions from './reactions.ts'
import help from './help.ts'
import type { WheelSubcommand } from '../../../types.ts'

export default {
  list,
  members,
  reactions,
  help
} satisfies Record<string, WheelSubcommand> as Record<string, WheelSubcommand>
