import { deferResponse, filterOutBots, getGuildMembers } from '../../command-util.ts'
import * as wheelUtil from '../wheel-util.ts'
import * as opts from '../options.ts'
import {
  type APIGuildMember,
  DCommandOptionType,
  UnloggedError,
  type WheelInteraction,
  type WheelSubcommand
} from '../../../types.ts'

const members: WheelSubcommand = {
  data: {
    name: 'members',
    description: 'Create a wheel of server members',
    type: DCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'role',
        description: 'The role to select users from',
        type: DCommandOptionType.ROLE
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

    await deferResponse(interaction)

    const allMembers = await getGuildMembers(interaction.guild_id)
    const members = filterMembers(interaction, allMembers)
    wheelConfig.entries = wheelUtil.shuffleArray(members.map(getEntryFromGuildMember))

    const modifiedWheelConfig = wheelUtil.applyOptionsToWheelConfig(interaction, wheelConfig)

    await wheelUtil.spinAndSendToDiscord(interaction, modifiedWheelConfig, 'gif')
  }
}

export default members

function filterMembers(interaction: WheelInteraction, members: APIGuildMember[]) {
  const roleId = wheelUtil.getOptionValue(interaction, 'role')

  if (!roleId) {
    // No role specified, return all non-bot members
    return filterOutBots(members)
  }

  const roleMembers = members.filter(({ roles }) => roles.includes(roleId))
  const roleMembersWithNoBots = filterOutBots(roleMembers)
  if (!roleMembersWithNoBots.length) {
    // If the role only has bots, allow bots to be selected
    if (roleMembers.length) return roleMembers

    // Handle roles with no members, invalid roles, and @everyone role
    const role = interaction.data.resolved?.roles?.[roleId]
    if (!role) throw new UnloggedError('The role was not found')
    if (role.name === '@everyone') return filterOutBots(members)
    throw new UnloggedError(`No members found with the role "${role.name}"`)
  }
  return roleMembersWithNoBots
}

function getEntryFromGuildMember(member: APIGuildMember) {
  return {
    text: member.nick || member.user?.global_name || member.user?.username,
    discordId: `<@${member.user?.id}>`
  }
}
