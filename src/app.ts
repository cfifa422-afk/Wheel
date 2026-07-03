import { env } from 'node:process'
import { H3, serve } from 'h3'
import { getBotStats, handleError, verifyKey } from './app-util.ts'
import commands from './commands/index.ts'
import { type APIInteraction, DInteractionType, DInteractionResponseType } from './types.ts'

const CLIENT_PUBLIC_KEY = env.CLIENT_PUBLIC_KEY

if (!CLIENT_PUBLIC_KEY) throw Error('CLIENT_PUBLIC_KEY not set!')
if (!env.TOKEN) throw Error('TOKEN not set!')
if (!env.WHEEL_OF_NAMES_API) throw Error('WHEEL_OF_NAMES_API not set!')
if (!env.WHEEL_OF_NAMES_API_KEY) throw Error('WHEEL_OF_NAMES_API_KEY not set!')

const app = new H3()

app.get('/', () => 'OK')

app.post('/', async ({ req, res }) => {
  const verificationResult = await verifyKey(CLIENT_PUBLIC_KEY, req)
  if (verificationResult === false) {
    res.status = 401
    return 'Bad request signature'
  }

  const interaction: APIInteraction = verificationResult

  switch (interaction.type) {
    case DInteractionType.PING:
      return { type: DInteractionResponseType.PONG }

    case DInteractionType.APPLICATION_COMMAND:
      setImmediate(() => {
        void commands[interaction.data.name]
          .execute(interaction as any)
          .catch(handleError(interaction))
      })
      return { type: DInteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE }
  }
})

app.get('/guild-count', getBotStats)

const port = Number(env.PORT) || 3000
const server = serve(app, { port })
server.ready().then(() => console.log(`Listening on port ${port}`))
