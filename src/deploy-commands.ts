import process from 'node:process'
import { client, CLIENT_ID } from './app-util.ts'
import commands from './commands/index.ts'

if (!process.env.TOKEN) throw Error('TOKEN not found!')

async function deployCommands() {
  console.log('Deploying commands...')
  try {
    await client.interaction.bulkOverwriteApplicationCommands(
      CLIENT_ID,
      Object.values(commands).map(({ data }) => data)
    )
    console.log('Successfully registered application commands.')
  } catch (e) {
    console.error(e)
  }
  process.exit()
}

deployCommands()
