import { getBotStats } from '../app-util.ts'
import { getSpinHistory } from '../spin-history.ts'
import { deferResponse, followupDeferredResponse } from './command-util.ts'
import {
  DApplicationCommandType,
  DIntegrationType,
  DInteractionContext,
  type ChatInputCommand
} from '../types.ts'

const MEDALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

const statistics: ChatInputCommand = {
  data: {
    name: 'statistics',
    type: DApplicationCommandType.CHAT_INPUT,
    description: 'Shows bot statistics and the last 10 wheel spins',
    contexts: [
      DInteractionContext.GUILD,
      DInteractionContext.BOT_DM,
      DInteractionContext.PRIVATE_CHANNEL
    ],
    integration_types: [DIntegrationType.GUILD_INSTALL, DIntegrationType.USER_INSTALL]
  },
  execute: async (interaction) => {
    deferResponse(interaction)

    const stats = await getBotStats().catch(() => null)
    const history = getSpinHistory()

    const statsLine = stats
      ? `🏰 **Guilds:** ${stats.guildCount.toLocaleString()}　👤 **User installs:** ${stats.userCount.toLocaleString()}`
      : '🏰 **Guilds:** unavailable　👤 **User installs:** unavailable'

    const lines: string[] = [
      '## 📊 Statistics',
      '',
      statsLine,
      '',
      '**Last 10 spins:**'
    ]

    if (!history.length) {
      lines.push('*No spins yet — use `/wheel` to get started!*')
    } else {
      for (const [i, record] of history.entries()) {
        const ts = Math.floor(record.timestamp / 1000)
        lines.push(
          `${MEDALS[i]} \`/wheel ${record.subcommand}\` — ${record.entryCount} entries · <t:${ts}:R>`
        )
      }
    }

    await followupDeferredResponse(interaction, lines.join('\n'), { suppressEmbeds: true })
  }
}

export default statistics
