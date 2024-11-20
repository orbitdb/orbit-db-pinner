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

  describe('unauthorized auth', function () {
    const setUpUnauthorizedKeyStore = async () => {
      await renameSync(rpcPath(), 'voyager/rpc.bak')
      const keystore = await KeyStore({ path: rpcPath() })
      const identities = await Identities({ keystore })
      await identities.createIdentity({ id: rpcId })
      await keystore.close()
    }

    const tearDownUnauthorizedKeyStore = async () => {
      await rimraf(rpcPath())
      await renameSync('voyager/rpc.bak', rpcPath())
    }

    it('adds an address without authorization', async function () {
      await setUpUnauthorizedKeyStore()

      try {
        execSync('./src/bin/cli.js auth add 0x123')
      } catch (e) {
        strictEqual(e.stderr.toString(), '{ type: 200, message: \'user is not authorized\' }\n')
      }

      await tearDownUnauthorizedKeyStore()
    })

    it('removes an address without authorization', async function () {
      execSync('./src/bin/cli.js auth add 0x123')

      await setUpUnauthorizedKeyStore()

      try {
        execSync('./src/bin/cli.js auth remove 0x123')
      } catch (e) {
        strictEqual(e.stderr.toString(), '{ type: 200, message: \'user is not authorized\' }\n')
      }

      await tearDownUnauthorizedKeyStore()
    })

    it('lists addresses without authorization', async function () {
      await setUpUnauthorizedKeyStore()

      try {
        execSync('./src/bin/cli.js auth list 0x123')
      } catch (e) {
        strictEqual(e.stderr.toString(), '{ type: 200, message: \'user is not authorized\' }\n')
      }

      await tearDownUnauthorizedKeyStore()
    })
  })
})
