import { appPath, orbiterPath } from '../../src/utils/id.js'
import { spawn } from 'node:child_process'
import { strictEqual } from 'assert'
import { existsSync } from 'fs'
import { rimraf } from 'rimraf'
import { join } from 'path'
import waitForDaemonStarted from '../utils/wait-for-daemon-start.js'

describe('daemon', function () {
  describe('defaults', function () {
    it('starts daemon in default directory', async function () {
      const daemon = spawn('./src/bin/cli.js', ['daemon'])

      await waitForDaemonStarted(daemon)

      strictEqual(existsSync(appPath()), true)
      strictEqual(existsSync(orbiterPath()), true)

      daemon.kill()
      await rimraf('voyager')
    })
  })

  describe('custom settings', function () {
    it('starts daemon in custom directory', async function () {
      const directory = 'alternative-directory'
      const daemon = spawn('./src/bin/cli.js', ['daemon', '-d', directory])

      await waitForDaemonStarted(daemon)

      strictEqual(existsSync(directory), true)
      strictEqual(existsSync(join(directory, appPath())), true)
      strictEqual(existsSync(join(directory, orbiterPath())), true)

      daemon.kill()
      await rimraf(directory)
    })
  })
})
