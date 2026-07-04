# HTTP Discord Wheel-spinning Bot

A Discord bot that uses the Wheel of Names API to spin wheels in Discord servers. Built as an HTTP interaction bot (no gateway) using [h3](https://h3.unjs.io/) and [snowtransfer](https://github.com/DasWolke/SnowTransfer).

## How to run

```
npm run dev
```

The server listens on port 3000. For Discord to send interactions to this bot, the public URL must be registered as the **Interactions Endpoint URL** in the Discord Developer Portal.

## Deploy commands

Before the bot responds to slash commands, register them with Discord:

```
npm run deploy-commands
```

## Environment variables

Already configured in the Replit environment (non-secret):

| Variable | Description |
|---|---|
| `CLIENT_ID` | Discord application client ID |
| `CLIENT_PUBLIC_KEY` | Discord application public key |
| `WHEEL_OF_NAMES_API` | Wheel of Names API base URL |
| `MIN_SPIN_TIME` | Minimum spin duration (seconds) |
| `DEFAULT_SPIN_TIME` | Default spin duration (seconds) |
| `MAX_SPIN_TIME` | Maximum spin duration (seconds) |
| `MAX_VISIBLE_ENTRIES` | Max entries shown in responses |
| `BOT_VERSION` | Version label |

**Secrets still needed** (add via Replit Secrets):

| Secret | Description |
|---|---|
| `TOKEN` | Discord bot token |
| `WHEEL_OF_NAMES_API_KEY` | Wheel of Names API key |

## Stack

- **Runtime**: Node.js 24+, TypeScript (tsx via `--watch`)
- **HTTP server**: h3 v2
- **Discord**: snowtransfer (REST only, no gateway)
- **Formatter/linter**: oxfmt + oxlint

## User preferences
