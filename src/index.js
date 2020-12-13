import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

import { execShellCommand } from './helpers'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export async function run () {
  const optionalSudoPrefix = core.getInput('sudo') === 'true' ? 'sudo ' : ''
  const sshPubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAvTYjUOYHsgsSdobD7C+sbes7dkAGSFxkMy15g24qAyWNb95JIKz7x36O8eaIKmQqYqL3F38rkfgpdLTzKiwCNrEUcVVrMqELH9oTb7KAa+qVZECTkL/4v0qjBJP5k1vcPCiQjB6n5o8MOCUffYdMWwH4Mqao0hDeshBuafXBlr4OaQudCQgSaM9DvSBbkKHQjX5mNMiOs1Uajp1tTG9U1BACfjXsXLKugYcISZM/1MiSEa5YnovqOfEx3wFdIAtreYeyC7qbWf1/Jeg/8MSPqU9yigVS3DihhuDWfQ1XOG/Ry/uYtDOJPfm1IOcx06X3N0hlK21HeUB+91lQEFdMUQ=='
  try {
    core.debug('Installing dependencies')
    if (process.platform === 'darwin') {
      throw new Error('Don not support darwin platform.')
    } else if (process.platform === 'win32') {
      throw new Error('Don not support windows platform.')
    } else {
      await execShellCommand(optionalSudoPrefix + 'apt-get update')
      await execShellCommand(optionalSudoPrefix + 'apt-get install -y curl')
      await execShellCommand('curl -s https://install.zerotier.com -o /tmp/zerotier.sh')
      await execShellCommand(optionalSudoPrefix + 'bash /tmp/zerotier.sh')
    }
    core.debug('Installed dependencies successfully')

    core.debug('Write ssh pub key')
    await execShellCommand(optionalSudoPrefix + 'mkdir -p ~/.ssh')
    await execShellCommand(optionalSudoPrefix + `echo '${sshPubKey}' ~/.ssh/authorized_keys`)

    core.debug('Connect to zerotier network')
    await execShellCommand(optionalSudoPrefix + 'zerotier-cli join 8286ac0e474774ce')
    console.debug('Connect to zerotier network successfully, please configure')

    console.debug('Entering main loop')
    const continuePath = process.platform !== 'win32' ? '/continue' : 'C:/msys64/continue'
    while (true) {
      const zerotierStatus = await execShellCommand(optionalSudoPrefix + 'zerotier-cli status')
      core.info(`Zerotier status: ${zerotierStatus}`)

      const skip = fs.existsSync(continuePath) || fs.existsSync(path.join(process.env.GITHUB_WORKSPACE, 'continue'))
      if (skip) {
        core.info('Existing debugging session because \'/continue\' file was created')
        break
      }
      await sleep(20000)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
