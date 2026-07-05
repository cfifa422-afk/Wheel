import type {
  APIInteraction,
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandInteractionDataSubcommandOption,
  APIChatInputApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionData,
  APIUserApplicationCommandInteraction,
  APIMessageApplicationCommandInteraction,
  APIPrimaryEntryPointCommandInteraction,
  APIApplicationCommandSubcommandOption,
  APIApplicationCommandStringOption,
  APIApplicationCommandIntegerOption,
  APIApplicationCommandBooleanOption,
  APIApplicationCommandUserOption,
  APIApplicationCommandChannelOption,
  APIApplicationCommandRoleOption,
  APIApplicationCommandMentionableOption,
  APIApplicationCommandNumberOption,
  APIApplicationCommandAttachmentOption,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'

export class UnloggedError extends Error {}

export type Command = ChatInputCommand | UserCommand | MessageCommand | PrimaryEntryPointCommand

interface BaseCommand<T extends APIInteraction> {
  data: RESTPostAPIApplicationCommandsJSONBody
  execute: (interaction: T) => Promise<any>
}

export type ChatInputCommand = BaseCommand<APIChatInputApplicationCommandInteraction>
export type UserCommand = BaseCommand<APIUserApplicationCommandInteraction>
export type MessageCommand = BaseCommand<APIMessageApplicationCommandInteraction>
export type PrimaryEntryPointCommand = BaseCommand<APIPrimaryEntryPointCommandInteraction>

export interface ChatInputCommandInteraction extends APIChatInputApplicationCommandInteraction {
  data: any
  deferred?: boolean
}

export interface WheelInteraction extends ChatInputCommandInteraction {
  data: CommandInteractionDataWithSubcommandWithOptions
}

interface CommandInteractionDataWithSubcommandWithOptions extends APIChatInputApplicationCommandInteractionData {
  options: CommandInteractionSubcommandWithOptions[]
}

interface CommandInteractionSubcommandWithOptions extends APIApplicationCommandInteractionDataSubcommandOption {
  options: APIApplicationCommandInteractionDataBasicOption[]
}

export interface ComponentAction<T extends APIInteraction> {
  execute: (interaction: T) => Promise<void>
}

export interface WheelSubcommand {
  data: WheelSubcommandData
  execute: (interaction: WheelInteraction) => Promise<any>
}

interface WheelSubcommandData extends APIApplicationCommandSubcommandOption {
  options: (
    | APIApplicationCommandStringOption
    | APIApplicationCommandIntegerOption
    | APIApplicationCommandBooleanOption
    | APIApplicationCommandUserOption
    | APIApplicationCommandChannelOption
    | APIApplicationCommandRoleOption
    | APIApplicationCommandMentionableOption
    | APIApplicationCommandNumberOption
    | APIApplicationCommandAttachmentOption
  )[]
}

export const DInteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
} as const

export const DInteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
  PREMIUM_REQUIRED: 10,
  LAUNCH_ACTIVITY: 12
} as const

export const DInteractionContext = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2
} as const

export const DIntegrationType = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1
} as const

export const DApplicationCommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
  PRIMARY_ENTRY_POINT: 4
} as const

export const DCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11
} as const

export interface WheelEntry {
  text?: string
  image?: string
  id?: string
  weight?: number
  color?: string
  sound?: string
  message?: string
  enabled?: boolean
  /** Discord mention string stored locally, stripped before sending to the API */
  discordId?: string
}

export interface WheelConfig {
  afterSpinSound: string
  afterSpinSoundVolume: number
  allowDuplicates: boolean
  animateWinner: boolean
  autoRemoveWinner: boolean
  centerText: string
  colorSettings: {
    color: string
    enabled: boolean
  }[]
  coverImageName: string
  coverImageType: string
  customCoverImageDataUri: string
  customPictureDataUri: string
  customPictureName: string
  description: string
  displayHideButton: boolean
  displayRemoveButton: boolean
  displayWinnerDialog: boolean
  drawOutlines: boolean
  drawShadow: boolean
  duringSpinSound: string
  duringSpinSoundVolume: number
  entries: WheelEntry[]
  galleryPicture: string
  hubSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  isAdvanced: boolean
  launchConfetti: boolean
  maxNames: number
  pageBackgroundColor: string
  pictureType: string
  playClickWhenWinnerRemoved: boolean
  showTitle: boolean
  slowSpin: boolean
  spinTime: number
  title: string
  type: 'color' | 'image'
  winnerMessage: string
  pointerChangesColor: boolean
  pageGradient: boolean
}

export * from 'discord-api-types/v10'
