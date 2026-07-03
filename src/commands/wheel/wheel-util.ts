import { env } from 'node:process'
import validateColor from 'validate-color'
import { client, CLIENT_ID, DEFAULT_SPIN_TIME, MAX_VISIBLE_ENTRIES } from '../../app-util.ts'
import { themeDictionary } from './ColorThemeList.ts'
import { saveSpinState } from './wheel-state.ts'
import type {
  APIInteractionDataResolved,
  APIMessage,
  APIReaction,
  WheelInteraction,
  WheelConfig,
  WheelEntry
} from '../../types.ts'

export async function getAnimationFromWheelConfig(
  wheelConfig: WheelConfig,
  imageFormat: 'gif' | 'webp',
  loop?: boolean
): Promise<{ animation: Buffer; winner: WheelEntry }> {
  addIdsIfNotThere(wheelConfig.entries)
  const response = await fetch(`${env.WHEEL_OF_NAMES_API}/wheels/animate`, {
    method: 'POST',
    headers: {
      'x-api-key': env.WHEEL_OF_NAMES_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      wheelConfig,
      loop,
      imageFormat,
      responseFormat: 'formData',
      initialAngle: Math.random() * 2 * Math.PI
    })
  })
  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => '(no body)')
    console.error(`Wheel API error ${response.status}: ${errorText}`)
    throw Error(`Failed to get animation (${response.status}: ${errorText.slice(0, 200)})`)
  }
  const data = await response.formData()
  const file = data.get('animation') as File
  const arrayBuffer = await file.arrayBuffer()
  const winner = JSON.parse(data.get('winner') as string)
  console.log('[winner raw]', JSON.stringify(winner))
  const resolvedText = winner.discordId || (Array.isArray(winner.texts) ? winner.texts[0] : winner.texts) || winner.text
  console.log('[winner resolvedText]', resolvedText)
  return {
    animation: Buffer.from(arrayBuffer),
    winner: {
      ...winner,
      text: resolvedText
    }
  }
}

export function containsDiscordId(string: string): boolean {
  return /<(?:@|@&|#)\d{16,22}>/.test(string)
}

export function getEntriesFromString(entriesString: string, interaction: WheelInteraction) {
  const texts = getEntryTextsFromString(entriesString)
  const entries = texts.map((text) => getEntryFromText(text, interaction.data.resolved))

  if (getOptionBoolean(interaction, 'shuffle')) return shuffleArray(entries)

  return entries
}

function getEntryTextsFromString(entriesString: string): string[] {
  if (shouldDoNumberWheel(entriesString)) return fillNumbers(entriesString)

  entriesString = escapeCommas(entriesString)

  let splitBy = ' '
  if (entriesString.includes(' or ')) splitBy = ' or '
  if (entriesString.includes(',')) splitBy = ','
  if (entriesString.includes('\n')) splitBy = '\n'

  const entriesArray = entriesString
    .split(splitBy)
    .map((entry) => entry.trim())
    .filter((entry) => entry)

  return unEscapeCommas(entriesArray)
}

const NUMBER_WHEEL_REGEX = /^(?:(-?\d{1,4}) ?(?:-|to) ?)?(-?\d{1,4})$/

function shouldDoNumberWheel(string: string): boolean {
  return NUMBER_WHEEL_REGEX.test(string)
}

function fillNumbers(string: string): string[] {
  const match = string.match(NUMBER_WHEEL_REGEX)
  if (!match) return []
  const [a, b] = [match[1] ?? 1, match[2]].map(Number)
  const [low, high] = [Math.min(a, b), Math.max(a, b)]
  return Array.from({ length: high - low + 1 }, (_, i) => String(low + i))
}

function escapeCommas(string: string): string {
  return string.replaceAll('\\,', '{COMMA}')
}

function unEscapeCommas(array: string[]): string[] {
  return array.map((string) => string.replaceAll('{COMMA}', ','))
}

function getEntryFromText(text: string, resolved?: APIInteractionDataResolved) {
  const matches = text.match(/<(@|@&|#)\d{16,22}>/g)
  if (!matches || !resolved) return { text }
  const mentions = new Set(matches)

  let newText = text
  for (const mention of mentions) {
    const replacement = getMentionReplacement(mention, resolved)
    newText = newText.replaceAll(mention, replacement)
  }

  return { text: newText, discordId: text }
}

function getMentionReplacement(text: string, resolved: APIInteractionDataResolved) {
  const [full, type, id] = text.match(/<(@|@&|#)(\d{16,22})>/) || []
  if (!full) return text

  switch (type) {
    case '@':
      if (!resolved.members?.[id] && !resolved.users?.[id]) return full
      return (
        '@' +
        (resolved.members?.[id]?.nick ||
          resolved.users?.[id]?.global_name ||
          resolved.users?.[id]?.username ||
          'unknown-user')
      )

    case '@&':
      if (!resolved.roles?.[id]?.name) return full
      return '@' + resolved.roles[id].name

    case '#':
      if (!resolved.channels?.[id]?.name) return full
      return '#' + resolved.channels[id].name

    default:
      return full
  }
}

export function getColorSettingsOrUndefined(interaction: WheelInteraction) {
  const themeName = getOptionValue(interaction, 'theme')
  if (!themeName) return
  return themeDictionary[themeName].map((color) => ({ color, enabled: true }))
}

export function getPageBackgroundColorOrUndefined(interaction: WheelInteraction) {
  const background = getOptionValue(interaction, 'backgroundcolor')?.trim().toLowerCase()

  switch (background) {
    case undefined:
      return
    case 'dark':
      return '#313338'
    case 'no':
    case 'none':
    case 'off':
    case 'transparent':
    case 'clear':
      return 'transparent'
  }

  if (validateColor.validateHTMLColorName(background)) return background

  if (validateColor.validateHTMLColorHex(background)) return background.slice(0, 7)

  return
}

export async function spinAndSendToDiscord(
  interaction: WheelInteraction,
  wheelConfig: WheelConfig,
  imageFormat: 'gif' | 'webp'
) {
  const loop = getOptionBoolean(interaction, 'loop', 'ON')
  const spoiler = getOptionBoolean(interaction, 'spoilertag')
  const userId = interaction.member?.user.id || interaction.user!.id

  const result = await getAnimationFromWheelConfig(wheelConfig, imageFormat, loop)
  const message = await sendAnimation(interaction.token, result.animation, imageFormat)

  if (!result.winner.text) return

  await new Promise((r) => setTimeout(r, wheelConfig.spinTime * 1_000 + 500))
  await editAnimationMessage(interaction.token, message.id, result.winner, wheelConfig, spoiler, userId)

  const stateKey = saveSpinState({ wheelConfig, imageFormat, winner: result.winner, spoiler, userId })
  await sendSpinButtons(interaction.token, result.winner, stateKey, spoiler)
}

async function sendAnimation(
  interactionToken: string,
  animation: Buffer,
  imageFormat: 'gif' | 'webp'
) {
  console.log(`Sending ${(animation.byteLength / 1000000).toFixed(2)}MB animation to Discord`)
  return await client.interaction.createFollowupMessage(CLIENT_ID, interactionToken, {
    files: [{ name: `wheel.${imageFormat}`, file: animation }]
  })
}

export async function editAnimationMessage(
  token: string,
  messageId: string,
  winner: WheelEntry,
  wheelConfig: WheelConfig,
  spoiler: boolean,
  userId: string
) {
  if (!winner.id) throw Error('Winning entry is missing ID')
  let winnerText = winner.text ?? ''
  if (winnerText) {
    if (spoiler) winnerText = `||${winnerText}||`
    winnerText = `\n# ${winnerText}`
  }
  await client.interaction.editFollowupMessage(CLIENT_ID, token, messageId, {
    content:
      `### ${
        (winner.message ?? wheelConfig.winnerMessage).replaceAll('%u', `<@${userId}>`) ||
        'We have a winner!'
      }` + winnerText
  })
}

export async function sendSpinButtons(
  token: string,
  winner: WheelEntry,
  stateKey: string,
  spoiler: boolean
) {
  const winnerName = winner.text ?? 'Unknown'
  const displayName = spoiler ? `||${winnerName}||` : winnerName
  await client.interaction.createFollowupMessage(CLIENT_ID, token, {
    embeds: [
      {
        title: 'Result',
        description: `**${displayName}**`,
        color: 0x2b2d31,
        fields: [
          {
            name: 'Spin Options',
            value: 'Use the buttons below to spin again with or without the current winner.',
            inline: false
          }
        ],
        footer: {
          text: 'Wheel of Names'
        }
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Spin Again — Remove Winner',
            style: 1,
            custom_id: `spin_without:${stateKey}`
          },
          {
            type: 2,
            label: 'Spin Again — Keep All',
            style: 2,
            custom_id: `spin_with:${stateKey}`
          }
        ]
      }
    ]
  } as any)
}

export function getOptionValue<T = string>(interaction: WheelInteraction, optionName: string) {
  return interaction.data.options[0].options.find((option) => option.name === optionName)?.value as
    | T
    | undefined
}

export function getOptionBoolean(
  interaction: WheelInteraction,
  optionName: string,
  defaultValue: 'ON' | 'OFF' = 'OFF'
) {
  const optionValue = getOptionValue(interaction, optionName)
  if (optionValue === undefined) return defaultValue === 'ON'
  return optionValue === 'ON'
}

export async function getUsersFromReaction(
  channelId: string,
  message: APIMessage,
  reaction: APIReaction,
  after?: string
) {
  if (after) await new Promise((r) => setTimeout(r, 50 + Math.random() * 100))
  const emoji = reaction.emoji
  const reactions = await client.channel.getReactions(
    channelId,
    message.id,
    `${emoji.name}${emoji.id ? `:${emoji.id}` : ''}`,
    { limit: 100, after }
  )
  if (reactions.length && reactions.length % 100 === 0 && reactions.at(-1)?.id !== after) {
    const users = await getUsersFromReaction(channelId, message, reaction, reactions.at(-1)?.id)
    reactions.push(...users)
  }
  return reactions
}

export function applyOptionsToWheelConfig(
  interaction: WheelInteraction,
  oldConfig: WheelConfig
): WheelConfig {
  const newConfig = structuredClone(oldConfig)
  const spinTime = getOptionValue<number>(interaction, 'spintime')
  if (spinTime) newConfig.spinTime = spinTime
  const colorSettings = getColorSettingsOrUndefined(interaction)
  if (colorSettings) newConfig.colorSettings = colorSettings
  const pageBackgroundColor = getPageBackgroundColorOrUndefined(interaction)
  if (pageBackgroundColor) newConfig.pageBackgroundColor = pageBackgroundColor
  const winnerMessage = getOptionValue(interaction, 'winnermessage')
  if (winnerMessage) newConfig.winnerMessage = winnerMessage
  return newConfig
}

function addIdsIfNotThere(entries: WheelEntry[]) {
  if (!entries || !entries.map) return []
  return entries.map((entry) => {
    entry.id = entry.id || getNewEntryId()
    return entry
  })
}

export function shuffleArray<T>(inputArray: T[]) {
  const array = [...inputArray]
  let j: number
  for (let i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function getNewEntryId() {
  const charCount = 10
  let retVal = ''
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  for (let i = 0; i < charCount; i++) {
    retVal += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return retVal
}

export function createWheelConfig(config?: Partial<WheelConfig>): WheelConfig {
  return {
    // This top section actually matters
    entries: [],
    spinTime: DEFAULT_SPIN_TIME,
    maxNames: MAX_VISIBLE_ENTRIES,
    allowDuplicates: true,
    drawOutlines: false,
    drawShadow: true,
    pointerChangesColor: true,
    isAdvanced: false,
    winnerMessage: '',
    type: 'color',
    hubSize: 'S',
    pictureType: 'none',
    galleryPicture: '',
    customPictureName: '',
    customCoverImageDataUri: '',
    centerText: '',
    coverImageType: '',
    coverImageName: '',
    customPictureDataUri: '',
    slowSpin: false,
    pageBackgroundColor: '#FFFFFF',
    colorSettings: [
      { color: '#3369E8', enabled: true },
      { color: '#D50F25', enabled: true },
      { color: '#EEB211', enabled: true },
      { color: '#009925', enabled: true }
    ],
    // These have no effect
    afterSpinSound: 'no-sound',
    afterSpinSoundVolume: 0,
    duringSpinSound: 'no-sound',
    duringSpinSoundVolume: 0,
    animateWinner: false,
    autoRemoveWinner: false,
    title: 'Wheel',
    description: '',
    displayHideButton: false,
    displayRemoveButton: false,
    displayWinnerDialog: false,
    launchConfetti: false,
    playClickWhenWinnerRemoved: false,
    showTitle: false,
    pageGradient: false,
    ...config // Merge in the passed partial config
  }
}
