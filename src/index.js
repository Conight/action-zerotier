import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

import { execShellCommand } from './helpers'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export async function run () {
  const optionalSudoPrefix = core.getInput('sudo') === 'true' ? 'sudo ' : ''
  try {
    core.debug('Installing dependencies')
    if (process.platform === 'darwin') {
      throw new Error('Don not support darwin platform.')
    } else if (process.platform === 'win32') {
      throw new Error('Don not support windows platform.')
    } else {
      await execShellCommand(optionalSudoPrefix + 'apt-get update')
      await execShellCommand(optionalSudoPrefix + 'apt-get install -y curl')
      await execShellCommand(`curl -s https://install.zerotier.com | ${optionalSudoPrefix} bash`)
    }
    core.debug('Installed dependencies successfully')

    core.debug('Connect to zerotier network')
    await execShellCommand(optionalSudoPrefix + 'zerotier-cli join 8286ac0e474774ce')
    console.debug('Connect to zerotier network successfully, please configure')

    const zerotierStatus = await execShellCommand(optionalSudoPrefix + `zerotier-cli status`)

    console.debug('Entering main loop')
    const continuePath = process.platform !== 'win32' ? '/continue' : 'C:/msys64/continue'
    while (true) {
      core.info(`Zerotier status: ${zerotierStatus}`)

      const skip = fs.existsSync(continuePath) || fs.existsSync(path.join(process.env.GITHUB_WORKSPACE, 'continue'))
      if (skip) {
        core.info('Existing debugging session because \'/continue\' file was created')
        break
      }
      await sleep(5000)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
