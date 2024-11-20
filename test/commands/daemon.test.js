import { appPath, orbiterPath } from '../../src/utils/id.js'
import { exec } from 'node:child_process'
import { strictEqual } from 'assert'
import { existsSync } from 'fs'
import { rimraf } from 'rimraf'
import { join } from 'path'

describe('daemon', function () {
  describe('defaults', function () {
    it('starts daemon in default directory', async function () {
      const daemon = exec('./src/bin/cli.js daemon')

      // TODO: Probably a better way to establish if daemon is running.
      // Maybe ping it?
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 500)
      })

      strictEqual(existsSync(appPath()), true)
      strictEqual(existsSync(orbiterPath()), true)

      daemon.kill()
      await rimraf('voyager')
    })
  })

  describe('custom settings', function () {
    it('starts daemon in custom directory', async function () {
      const directory = 'alternative-directory'
      const daemon = exec(`./src/bin/cli.js daemon -d ${directory}`)

      // TODO: Probably a better way to establish if daemon is running.
      // Maybe ping it?
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 500)
      })

      strictEqual(existsSync(directory), true)
      strictEqual(existsSync(join(directory, appPath())), true)
      strictEqual(existsSync(join(directory, orbiterPath())), true)

      daemon.kill()
      await rimraf(directory)
    })
  })
})
