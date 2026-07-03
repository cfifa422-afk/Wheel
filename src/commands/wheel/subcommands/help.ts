import { env } from 'node:process'
import { CLIENT_ID, getBotStats } from '../../../app-util.ts'
import { createCommandOptionsFromStrings, followupDeferredResponse } from '../../command-util.ts'
import { DCommandOptionType, type WheelSubcommand } from '../../../types.ts'
import { getOptionValue } from '../wheel-util.ts'

const getDefaultHelpText = (guildCount: number) => `
Wheel of Names Discord bot version ${env.BOT_VERSION} - spinning wheels in ${guildCount} servers worldwide!
### Commands
- \`/wheel list\` - Create a wheel with custom entries
- \`/wheel members\` - Spin a wheel with members of the server
- \`/wheel reactions\` - Spin a wheel with users who reacted to a message
-# To read more about the commands, use \`/wheel help topic: commands\`.
-# To learn about command options, use \`/wheel help topic: options\`.

Get more cool features and customization at [wheelofnames.com](https://wheelofnames.com)

[Add me to your server](https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=309237763072&scope=bot%20applications.commands)
`

const helpTexts: Record<string, () => Promise<string>> = {
  general: () => getBotStats().then((stats) => getDefaultHelpText(stats.guildCount)),
  commands: () =>
    Promise.resolve(`
The \`/wheel\` command has four subcommands for spinning wheels.
### \`/wheel list\`
The \`/wheel list\` spins a wheel with the texts you enter in the \`entries\` option.
-# Use \`/wheel help topic: list\` to learn more about this command.
### \`/wheel members\`
The \`/wheel members\` command spins a wheel with members of the server and can filter by role.
-# Use \`/wheel help topic: members\` to learn more about this command.
### \`/wheel reactions\`
The \`/wheel reactions\` command spins a wheel with users who reacted to the message specified in the \`messagelink\` option.
-# Use \`/wheel help topic: reactions\` to learn more about this command.
`),
  list: () =>
    Promise.resolve(`
The \`/wheel list\` command lets you set the wheel's entries with a text string in the \`entries\` option.
### The \`entries\` option
Your input is split by line-breaks, commas, or spaces. Commas can be escaped with a backslash (\`\\\`).
Discord mentions are supported.
Enter just a number for numbers 1 -> \`N\`, or enter a number range like \`50-100\`.
### Additional options
- \`theme\`
- \`spoilertag\`
- \`shuffle\`
- \`backgroundcolor\`
- \`spintime\`
- \`loop\`
- \`winnermessage\`
-# To learn more about any of these options, use \`/wheel help topic: ______\`.
### Examples
- /wheel list \`entries: Ali Beatriz Charles Diya\`
- /wheel list \`entries: More than, one word, per entry\` \`backgroundcolor: darkred\`
- /wheel list \`entries: This\\, and that, That\\, and the other\` \`spintime: 6\`
- /wheel list \`entries: -20 to 20\` \`spoilertag: ON\` \`shuffle: ON\`
`),
  members: () =>
    Promise.resolve(`
The \`/wheel members\` command spins a wheel with members of the server.
### The \`role\` option
The \`role\` option lets you include only members with a specific role.
### Additional options
- \`theme\`
- \`spoilertag\`
- \`backgroundcolor\`
- \`spintime\`
- \`loop\`
- \`winnermessage\`
-# To learn more about any of these options, use \`/wheel help topic: ______\`.
### Examples
- /wheel members
- /wheel members \`role: @Giveaways\` \`backgroundcolor: navy\`
- /wheel members \`theme: Purple horizon\` \`spoilertag: ON\` \`spintime: 5\`
`),
  reactions: () =>
    Promise.resolve(`
The \`/wheel reactions\` command spins a wheel with users who reacted to the message specified in the \`messagelink\` option.
Get the link for the message you want by right-clicking or tapping and holding the message and selecting "Copy Message Link".
Also works with message IDs if in the same channel.
### Options
- \`theme\`
- \`spoilertag\`
- \`backgroundcolor\`
- \`spintime\`
- \`loop\`
- \`winnermessage\`
- \`customizationpath\`
-# To learn more about any of these options, use \`/wheel help topic: ______\`.
### Examples
- /wheel reactions \`messagelink: https://discord.com/channels/841034730935273482/916064286649174016/951100991215759461\`
- /wheel reactions \`messagelink: 951100991215759461\` \`theme: Underwater\` \`spoilertag: ON\`
- /wheel reactions \`messagelink: 951100991215759461\` \`backgroundcolor: seagreen\` \`spintime: 7\`
`),
  voice: () =>
    Promise.resolve(`
The \`/wheel voice\` command spins a wheel with members in a voice channel.
This command is on hiatus until Discord implements the necessary endpoints in their HTTP API.
`),
  options: () =>
    Promise.resolve(`
The \`/wheel\` commands each have a set of options that can be used to customize the wheel and/or its behavior.
### Common options
- \`theme\` - colors of the wheel's slices
- \`spoilertag\` - whether to mark the winner with a spoiler
- \`backgroundcolor\` - color of the background behind the wheel
- \`spintime\` - how long the wheel spins for
- \`loop\` - whether the spin replays automatically
- \`winnermessage\` - a message to show with the winner
-# To learn more about any of these options, use \`/wheel help topic: ______\`.
`),
  theme: () =>
    Promise.resolve(`
The \`theme\` option lets you set the colors of the wheel's slices. There are 25 themes to choose from, excluding the default theme.
If you want to preview the themes, go to [wheelofnames.com](https://wheelofnames.com) and open the Customize menu. Go to the Appearance tab and open the theme dropdown.
`),
  spoilertag: () =>
    Promise.resolve(`
The \`spoilertag\` option lets you mark the winner with a spoiler tag when set to "ON". This hides the winner's name until clicked.
`),
  shuffle: () =>
    Promise.resolve(`
The \`shuffle\` option lets you shuffle the wheel's entries before spinning when set to "ON". The commands that don't have this option shuffle by default.
`),
  backgroundcolor: () =>
    Promise.resolve(`
The \`backgroundcolor\` option lets you set the color of the background behind the wheel. You can use any CSS color name or hex code.
Valid color names are all lowercase and have no spaces.
### Examples
- "forestgreen"
- "skyblue"
- "chocolate"
- "deeppink"
A full list of valid color names can be found [here](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color).
If you don't want any background, use "transparent" or "none".
`),
  spintime: () =>
    Promise.resolve(`
The \`spintime\` option lets you set how long the wheel spins for. The default (and minimum) is 3 seconds. The maximum is 10 seconds.
Since Discord's upload size limit is so low, it's possible that long spins can result in errors. Try reducing the spin time if you encounter this.
For the \`/wheel shared\` command, the spin time is inherited from the shared wheel.
`),
  loop: () =>
    Promise.resolve(`
The \`loop\` option lets you set whether the wheel spin GIF replays automatically. The default is "ON". Setting this option to "OFF" will make the GIF play only once.
`),
  winnermessage: () =>
    Promise.resolve(`
The \`winnermessage\` option lets you change the message that is shown along with the winner. The default is "We have a winner!". If you want the winner message to mention the user who used the command, do so with \`%u\`.
For the \`/wheel shared\` command, the winner message is inherited from the shared wheel.
`)
}

const help: WheelSubcommand = {
  data: {
    name: 'help',
    description: 'Learn about the bot and how to use it',
    type: DCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'topic',
        description: 'Which topic you want to read about',
        type: DCommandOptionType.STRING,
        choices: createCommandOptionsFromStrings(...Object.keys(helpTexts))
      }
    ]
  },
  execute: async (interaction) => {
    const topic = getOptionValue(interaction, 'topic') || 'general'
    const content = await helpTexts[topic]()
    await followupDeferredResponse(interaction, content, { suppressEmbeds: false, ephemeral: true })
  }
}

export default help
