import { rpc as rpcId, rpcPath } from '../../src/utils/id.js'
import { Identities, KeyStore } from '@orbitdb/core'
import { exec, execSync } from 'node:child_process'
import { strictEqual } from 'assert'
import { renameSync } from 'fs'
import { rimraf } from 'rimraf'

describe('auth', function () {
  let daemon

  before(async function () {
    daemon = exec('./src/bin/cli.js daemon')

    // TODO: Probably a better way to establish if daemon is running.
    // Maybe ping it?
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
  })

  after(async function () {
    daemon.kill()
    await rimraf('voyager')
  })

  it('adds an address', function () {
    const ok = execSync('./src/bin/cli.js auth add 0x123')
    strictEqual(ok.toString(), 'ok\n')
    const list = execSync('./src/bin/cli.js auth list')
    strictEqual(list.toString(), '0x123\n')
    execSync('./src/bin/cli.js auth del 0x123')
  })

  it('removes an address', function () {
    execSync('./src/bin/cli.js auth  0x123')
    const ok = execSync('./src/bin/cli.js auth del 0x123')
    strictEqual(ok.toString(), 'ok\n')
    const list = execSync('./src/bin/cli.js auth list')
    strictEqual(list.toString(), '')
  })

  describe('not authorized', function () {
    before(async function () {
      await new Promise((resolve) => {
        process.nextTick(() => {
          resolve()
        })
      })

      await renameSync(rpcPath(), 'voyager/rpc.bak')
    })

    after(async function () {
      await rimraf(rpcPath())
      await renameSync('voyager/rpc.bak', rpcPath())
    })

    it('Adds an address without authorization', async function () {
      const keystore = await KeyStore(rpcPath())
      const identities = await Identities({ keystore })
      identities.createIdentity({ id: rpcId })

      try {
        execSync('./src/bin/cli.js auth add 0x123')
      } catch (e) {
        strictEqual(e.stderr.toString(), '{ type: 200, message: \'user is not authorized\' }\n')
      }
    })
  })
})
