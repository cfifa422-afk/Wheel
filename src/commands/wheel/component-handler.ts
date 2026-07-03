import { getSpinState, saveSpinState } from './wheel-state.ts'
import { getAnimationFromWheelConfig, editAnimationMessage, sendSpinButtons } from './wheel-util.ts'
import { followupDeferredResponse } from '../command-util.ts'
import { client, CLIENT_ID } from '../../app-util.ts'

export async function handleRespinAction(interaction: any) {
  const customId: string = interaction.data.custom_id
  const colonIdx = customId.indexOf(':')
  const action = customId.slice(0, colonIdx)
  const stateKey = customId.slice(colonIdx + 1)

  const state = getSpinState(stateKey)
  if (!state) {
    await followupDeferredResponse(
      interaction,
      '❌ This wheel session has expired. Please use `/wheel` again.'
    )
    return
  }

  const wheelConfig = structuredClone(state.wheelConfig)
  const userId = interaction.member?.user?.id || interaction.user?.id || state.userId

  if (action === 'spin_without') {
    wheelConfig.entries = wheelConfig.entries.filter((e: any) => e.id !== state.winner.id)
    if (wheelConfig.entries.length < 1) {
      await followupDeferredResponse(
        interaction,
        '❌ No entries left after removing the winner! Use `/wheel list` to start a new spin.'
      )
      return
    }
  }

  const result = await getAnimationFromWheelConfig(wheelConfig, state.imageFormat, true)

  console.log(`Sending ${(result.animation.byteLength / 1_000_000).toFixed(2)}MB animation to Discord (respin)`)
  const animMsg = await client.interaction.createFollowupMessage(CLIENT_ID, interaction.token, {
    files: [{ name: `wheel.${state.imageFormat}`, file: result.animation }]
  })

  await new Promise((r) => setTimeout(r, wheelConfig.spinTime * 1_000 + 500))

  await editAnimationMessage(
    interaction.token,
    animMsg.id,
    result.winner,
    wheelConfig,
    state.spoiler,
    userId
  )

  const newStateKey = saveSpinState({
    wheelConfig,
    imageFormat: state.imageFormat,
    winner: result.winner,
    spoiler: state.spoiler,
    userId
  })

  await sendSpinButtons(interaction.token, result.winner, newStateKey, state.spoiler)
}
