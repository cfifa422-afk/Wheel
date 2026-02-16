# HTTP Discord wheel-spinning bot using the Wheel of Names API

This is (most) of the source code for the original Wheel of Names Discord bot. There are a lot of reasons that this code is released in the way it is, so let's go through them.

1. Some features have been removed.
  - The re-spin feature, `/wheel shared` command, and `customizationpath` option have been removed, since they relied on proprietary packages, services, admin-only API endpoints, and more.

2. This is not realistic for most people to use.
  - This is not a standard Discord bot. This bot uses exclusively the HTTP API, entirely foregoing the gateway API that is the usual way to run a bot. Many features are limited to just the gateway API. This was the reason we removed the voice channel command.
  - In order to develop locally, you must set up a tunnel or reverse DNS to get a HTTPS endpoint pointing to your dev server.
  - If you want a more standard bot that integrates with the Wheel of Names API, check out [this repo](https://github.com/gomander/discordjs-sample-wheel-bot).

3. This bot uses a Discord HTTP API wrapper maintained sporadically by a single developer in their free time.
  - `snowtransfer` has served us well, but I would not recommend running a large production bot using it due to the risk of bugs and and going unmaintained.

4. This repo is provided in the interest of not leaving our community with nothing after we leave Discord.
  - There will be minimal support. Big issues may be fixed, but expect this repo to not change at all.
  - Again, I recommend using the discord.js template repo linked above instead of forking this one. However, you may take inspiration from or use code in this repo as much as you'd like.
