import { appPath, hostPath } from '../../src/utils/id.js'
import { spawn } from 'node:child_process'
import { strictEqual } from 'assert'
import { existsSync } from 'fs'
import { rimraf } from 'rimraf'
import { join } from 'path'
import waitForDaemonStarted from '../utils/wait-for-daemon-start.js'

describe('Commands - daemon', function () {
  describe('defaults', function () {
    it('starts daemon in default directory', async function () {
      const daemon = spawn('./src/bin/cli.js', ['daemon'])

      await waitForDaemonStarted(daemon)

      strictEqual(existsSync(appPath()), true)
      strictEqual(existsSync(hostPath()), true)

      daemon.kill()
      await rimraf('voyager')
    })
  })

  describe('custom directory - using --directory flag', function () {
    it('starts daemon in custom directory', async function () {
      const directory = 'alternative-directory'
      const daemon = spawn('./src/bin/cli.js', ['daemon', '-d', directory])

      await waitForDaemonStarted(daemon)

      strictEqual(existsSync(directory), true)
      strictEqual(existsSync(join(directory, appPath())), true)
      strictEqual(existsSync(join(directory, hostPath())), true)

      daemon.kill()
      await rimraf(directory)
    })
  })

  describe('custom directory - using VOYAGER_PATH env variable', function () {
    it('starts daemon in custom directory', async function () {
      const directory = 'another-directory'
      const daemon = spawn('./src/bin/cli.js', ['daemon'], { env: { ...process.env, VOYAGER_PATH: directory } })

      await waitForDaemonStarted(daemon)

      strictEqual(existsSync(directory), true)
      strictEqual(existsSync(join(directory, appPath())), true)
      strictEqual(existsSync(join(directory, hostPath())), true)

      daemon.kill()
      await rimraf(directory)
    })
  })
})
