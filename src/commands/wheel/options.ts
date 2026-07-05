import { createCommandOptionsFromStrings } from '../command-util.ts'
import { themeList } from './ColorThemeList.ts'
import {
  type APIApplicationCommandStringOption,
  type APIApplicationCommandIntegerOption,
  DCommandOptionType
} from '../../types.ts'
import { MAX_SPIN_TIME } from '../../app-util.ts'

export const themeOption: APIApplicationCommandStringOption = {
  name: 'theme',
  description: 'The color theme of the wheel',
  type: DCommandOptionType.STRING,
  choices: themeList
}

export const spoilerTagOption: APIApplicationCommandStringOption = {
  name: 'spoilertag',
  description: 'Spoiler tag the winner (default OFF)',
  type: DCommandOptionType.STRING,
  choices: createCommandOptionsFromStrings('ON', 'OFF')
}

export const shuffleOption: APIApplicationCommandStringOption = {
  name: 'shuffle',
  description: 'Shuffle the entries before spinning',
  type: DCommandOptionType.STRING,
  choices: createCommandOptionsFromStrings('ON', 'OFF')
}

export const backgroundColorOption: APIApplicationCommandStringOption = {
  name: 'backgroundcolor',
  description: 'One-word color name (e.g. skyblue) or hex code (default white)',
  type: DCommandOptionType.STRING
}

export const spinTimeOption: APIApplicationCommandIntegerOption = {
  name: 'spintime',
  description: `Spin duration in seconds (default 3, max ${MAX_SPIN_TIME})`,
  type: DCommandOptionType.INTEGER,
  min_value: 3,
  max_value: MAX_SPIN_TIME
}

export const loopOption: APIApplicationCommandStringOption = {
  name: 'loop',
  description: 'Loop the wheel spin animation (default ON)',
  type: DCommandOptionType.STRING,
  choices: createCommandOptionsFromStrings('ON', 'OFF')
}

export const winnerMessageOption: APIApplicationCommandStringOption = {
  name: 'winnermessage',
  description: 'The message to display when a winner is chosen',
  type: DCommandOptionType.STRING,
  min_length: 1,
  max_length: 100
}

export const respinButtonOption: APIApplicationCommandStringOption = {
  name: 'respinbutton',
  description: 'Show "Remove winner and spin again" button after spin (default ON)',
  type: DCommandOptionType.STRING,
  choices: createCommandOptionsFromStrings('ON', 'OFF')
}
