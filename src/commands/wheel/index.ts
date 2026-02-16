import subcommands from './subcommands/index.ts'
import {
  DApplicationCommandType,
  DCommandOptionType,
  DIntegrationType,
  DInteractionContext,
  type ChatInputCommand,
  type WheelInteraction
} from '../../types.ts'

const wheel: ChatInputCommand = {
  data: {
    name: 'wheel',
    type: DApplicationCommandType.CHAT_INPUT,
    description: 'Posts a wheel spinning gif with the parameters given',
    options: Object.values(subcommands).map(({ data }) => data),
    contexts: [
      DInteractionContext.GUILD,
      DInteractionContext.BOT_DM,
      DInteractionContext.PRIVATE_CHANNEL
    ],
    integration_types: [DIntegrationType.GUILD_INSTALL, DIntegrationType.USER_INSTALL]
  },
  execute: async (interaction) => {
    if (interaction.data.options?.[0]?.type !== DCommandOptionType.SUB_COMMAND) {
      throw Error(`Invalid /wheel command: ${JSON.stringify(interaction.data)}`)
    }
    const subcommand = interaction.data.options[0].name
    const optionsString = interaction.data.options[0].options
      ?.map(({ name, value }) => `${name}: ${value}`)
      .join(' ')
    console.log(`/wheel ${subcommand} ${optionsString}`)
    return await subcommands[subcommand].execute(interaction as WheelInteraction)
  }
}

export default wheel
