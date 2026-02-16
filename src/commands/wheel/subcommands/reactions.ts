import { client } from '../../../app-util.ts'
import * as commandUtil from '../../command-util.ts'
import * as wheelUtil from '../wheel-util.ts'
import * as opts from '../options.ts'
import {
  type APIMessage,
  type APIUser,
  DCommandOptionType,
  UnloggedError,
  type WheelInteraction,
  type WheelSubcommand
} from '../../../types.ts'

const reactions: WheelSubcommand = {
  data: {
    name: 'reactions',
    description: 'Create a wheel of people who reacted to a message',
    type: DCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'messagelink',
        description: 'The link to the message to get reactions from',
        type: DCommandOptionType.STRING,
        required: true,
        min_length: 8,
        max_length: 100
      },
      opts.themeOption,
      opts.spoilerTagOption,
      opts.backgroundColorOption,
      opts.spinTimeOption,
      opts.loopOption,
      opts.winnerMessageOption
    ]
  },
  execute: async (interaction) => {
    if (!interaction.guild_id) throw new UnloggedError('This command must be used in a server')

    if (!Object.values(interaction.authorizing_integration_owners).includes(interaction.guild_id))
      throw new UnloggedError('The bot must be added to this server for this command to work')

    const wheelConfig = wheelUtil.createWheelConfig()

    const winnerMessage = wheelUtil.getOptionValue(interaction, 'winnermessage')
    if (winnerMessage) wheelConfig.winnerMessage = winnerMessage

    const messageLink = getMessageLinkComponents(interaction)
    if (!messageLink.message) throw new UnloggedError('Invalid message link')
    let channelId: string | undefined = undefined
    if (messageLink.guild === '@me') {
      if (messageLink.channel !== interaction.channel.id) {
        throw new UnloggedError('The message must be in this channel')
      }
      channelId = messageLink.channel
    } else if (messageLink.guild) {
      if (messageLink.guild !== interaction.guild_id) {
        throw new UnloggedError('The message must be in this server')
      }
      channelId = await getChannelId(interaction, messageLink)
    } else {
      channelId = messageLink.channel || interaction.channel.id
    }
    if (!channelId) throw new UnloggedError('The channel was not found')
    const message = await getMessage(channelId, messageLink.message)
    if (!message.reactions?.length) throw new UnloggedError('The message has no reactions')

    await commandUtil.deferResponse(interaction)

    const reactions = await getReactionsFromMessage(channelId, message)
    const users = getUsersFromReactions(reactions)
    wheelConfig.entries = wheelUtil.shuffleArray(getEntriesFromUsers(users))

    const modifiedWheelConfig = wheelUtil.applyOptionsToWheelConfig(interaction, wheelConfig)

    await wheelUtil.spinAndSendToDiscord(interaction, modifiedWheelConfig, 'webp')
  }
}

export default reactions

function getMessageLinkComponents(interaction: WheelInteraction) {
  const input = wheelUtil.getOptionValue(interaction, 'messagelink')!
  const matches = input.match(/(\d{16,22}|@me)/g)
  return {
    guild: matches?.at(-3),
    channel: matches?.at(-2),
    message: matches?.at(-1)
  }
}

async function getChannelId(interaction: WheelInteraction, messageLink: MessageLinkComponents) {
  if (!messageLink.channel || messageLink.channel === interaction.channel.id) {
    return interaction.channel.id
  }
  const channels = await client.guild.getGuildChannels(interaction.guild_id!)
  const channel = channels.find(({ id }) => id === messageLink.channel)
  return channel?.id
}

function getMessage(channelId: string, messageId: string) {
  try {
    return client.channel.getChannelMessage(channelId, messageId)
  } catch {
    throw new UnloggedError('The message was not found')
  }
}

function getReactionsFromMessage(channelId: string, message: APIMessage) {
  return Promise.all(
    message.reactions!.map((reaction) =>
      wheelUtil.getUsersFromReaction(channelId, message, reaction)
    )
  )
}

function getUsersFromReactions(userArrays: APIUser[][]) {
  const usersWithDupes = commandUtil.filterOutBots(userArrays.flat())
  const userIds = new Set(usersWithDupes.map(({ id }) => id))
  return Array.from(userIds).map((userId) => usersWithDupes.find(({ id }) => id === userId)!)
}

function getEntriesFromUsers(users: APIUser[]) {
  return users.map((user) => ({
    text: user.global_name || user.username,
    discordId: `<@${user.id}>`
  }))
}

type MessageLinkComponents = {
  guild?: string
  channel?: string
  message?: string
}
