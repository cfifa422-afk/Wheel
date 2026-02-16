import { env } from 'node:process'
import { verifyKey as verifyKeyDiscordInteractions } from 'discord-interactions'
import { SnowTransfer } from 'snowtransfer'
import { sendError } from './commands/command-util.ts'
import { UnloggedError, type APIInteraction } from './types.ts'

export const CLIENT_ID = env.CLIENT_ID || ''
if (!CLIENT_ID) throw Error('CLIENT_ID not set!')
export const MIN_SPIN_TIME = Number(env.MIN_SPIN_TIME)
if (!MIN_SPIN_TIME) throw Error('MIN_SPIN_TIME not set!')
export const DEFAULT_SPIN_TIME = Number(env.DEFAULT_SPIN_TIME)
if (!DEFAULT_SPIN_TIME) throw Error('DEFAULT_SPIN_TIME not set!')
export const MAX_SPIN_TIME = Number(env.MAX_SPIN_TIME)
if (!MAX_SPIN_TIME) throw Error('MAX_SPIN_TIME not set!')
export const MAX_VISIBLE_ENTRIES = Number(env.MAX_VISIBLE_ENTRIES)
if (!MAX_VISIBLE_ENTRIES) throw Error('MAX_VISIBLE_ENTRIES not set!')

export const client = new SnowTransfer(env.TOKEN)

const botStats = { guildCount: 0, userCount: 0 }

export async function getBotStats(): Promise<typeof botStats> {
  if (!botStats.guildCount || !botStats.userCount) {
    const { approximate_guild_count, approximate_user_install_count } =
      await client.bot.getApplicationInfo()
    if (approximate_guild_count) botStats.guildCount = approximate_guild_count
    if (approximate_user_install_count) botStats.userCount = approximate_user_install_count
  }
  return botStats
}

export async function verifyKey(clientPublicKey: string, req: Request) {
  const signature = req.headers.get('X-Signature-Ed25519')
  const timestamp = req.headers.get('X-Signature-Timestamp')
  if (!timestamp || !signature) return false
  const body = await req.text()
  const isValid = await verifyKeyDiscordInteractions(body, signature, timestamp, clientPublicKey)
  if (!isValid) return false
  return JSON.parse(body)
}

export function handleError(interaction: APIInteraction) {
  return (error: unknown) => {
    void sendError(interaction, error)
    if (!(error instanceof UnloggedError)) console.error(error)
  }
}
