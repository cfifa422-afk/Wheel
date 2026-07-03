import { client, CLIENT_ID } from '../app-util.ts'
import {
  DInteractionResponseType,
  type APIInteraction,
  type APIUser,
  type APIGuildMember,
  type APIMessageComponentInteraction,
  type ChatInputCommandInteraction
} from '../types.ts'

const defaultError = 'Something went wrong! Please try again later.'

export async function sendResponse(
  interaction: APIInteraction,
  message: string,
  { ephemeral = false, suppressEmbeds = true } = {}
) {
  await client.interaction.createInteractionResponse(interaction.id, interaction.token, {
    type: DInteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: message,
      flags: (suppressEmbeds ? 4 : 0) | (ephemeral ? 64 : 0) || undefined
    }
  })
}

export function deferResponse(
  interaction: ChatInputCommandInteraction,
  _options: { ephemeral?: boolean } = {}
) {
  // The HTTP response in app.ts already sends the deferred acknowledgement (type 5).
  // This function just marks the interaction as deferred for error-handling purposes.
  interaction.deferred = true
}

export async function followupDeferredResponse(
  interaction: APIInteraction,
  message: string,
  { suppressEmbeds = true, ephemeral = false } = {}
) {
  return await client.interaction.createFollowupMessage(CLIENT_ID, interaction.token, {
    content: message,
    flags: (suppressEmbeds ? 4 : 0) | (ephemeral ? 64 : 0) || undefined
  })
}

export async function deferUpdate(
  interaction: APIMessageComponentInteraction & { deferred?: boolean }
) {
  interaction.deferred = true
  await client.interaction.createInteractionResponse(interaction.id, interaction.token, {
    type: DInteractionResponseType.DEFERRED_UPDATE_MESSAGE
  })
}

export async function sendError(
  interaction: APIInteraction & { deferred?: boolean },
  error?: unknown
) {
  const errorString = unknownErrorToString(error)
  return await followupDeferredResponse(interaction, errorString, { suppressEmbeds: true })
}

export function unknownErrorToString(error: unknown) {
  if (error instanceof Error) return error.message || defaultError
  if (typeof error === 'string') return error
  return defaultError
}

export function createCommandOptionsFromStrings(...strings: string[]) {
  return strings.map((string) => ({ name: string, value: string }))
}

export async function getGuildMembers(guildId: string) {
  const members: APIGuildMember[] = []
  let newMembers: typeof members
  do {
    const after = members.at(-1)?.user?.id || '0'
    newMembers = await client.guild.getGuildMembers(guildId, { limit: 1000, after })
    members.push(...newMembers)
  } while (newMembers.length === 1000)
  return members
}

export function filterOutBots<T extends APIUser | APIGuildMember>(users: T[]) {
  return users.filter((user) => {
    if ('joined_at' in user && 'user' in user) return !user.user.bot
    return !user.bot
  })
}

export async function getRole(roleId: string, guildId: string) {
  const roles = await client.guild.getGuildRoles(guildId)
  return roles.find(({ id }) => id === roleId)
}
