import * as wheelUtil from '../wheel-util.ts'
import { deferResponse } from '../../command-util.ts'
import * as opts from '../options.ts'
import { UnloggedError, DCommandOptionType, type WheelSubcommand } from '../../../types.ts'

const list: WheelSubcommand = {
  data: {
    name: 'list',
    description: 'Create a wheel using a list of entries',
    type: DCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'entries',
        description: 'The entries on the wheel, separated by spaces or commas',
        type: DCommandOptionType.STRING,
        required: true,
        max_length: 1500
      },
      opts.themeOption,
      opts.spoilerTagOption,
      opts.shuffleOption,
      opts.backgroundColorOption,
      opts.spinTimeOption,
      opts.loopOption,
      opts.winnerMessageOption,
      opts.respinButtonOption
    ]
  },
  execute: async (interaction) => {
    const wheelConfig = wheelUtil.createWheelConfig()

    const winnerMessage = wheelUtil.getOptionValue(interaction, 'winnermessage')
    if (winnerMessage) wheelConfig.winnerMessage = winnerMessage

    const entriesString = wheelUtil.getOptionValue(interaction, 'entries') || ''
    const entries = wheelUtil.getEntriesFromString(entriesString, interaction)
    if (entries.length < 1) throw new UnloggedError('You must input at least one entry')

    await deferResponse(interaction)

    wheelConfig.entries = entries

    const modifiedWheelConfig = wheelUtil.applyOptionsToWheelConfig(interaction, wheelConfig)

    await wheelUtil.spinAndSendToDiscord(interaction, modifiedWheelConfig, 'gif')
  }
}

export default list
