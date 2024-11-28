import { deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { RPC } from '../src/index.js'
import { spawn } from 'node:child_process'
import waitForDaemonStarted from './utils/wait-for-daemon-start.js'

describe('RPC', function () {
  let daemon
  let rpc

  before(async function () {
    daemon = spawn('./src/bin/cli.js', ['daemon'])

    await waitForDaemonStarted(daemon)

    rpc = await RPC({ directory: '' })
  })

  after(async function () {
    daemon.kill()
    await rimraf('voyager')
  })

  it('adds an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await rpc.authAdd({ id })
    const { message } = await rpc.authList()
    deepStrictEqual(message, [id])
  })

  it('removes an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await rpc.authAdd({ id })
    await rpc.authDel({ id })
    const { message } = await rpc.authList()
    deepStrictEqual(message, [])
  })
})
