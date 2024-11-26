import { spawn, execSync } from 'node:child_process'
import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import waitForDaemonStarted from '../utils/wait-for-daemon-start.js'

describe('Commands - address', function () {
  let daemon

  before(async function () {
    daemon = spawn('./src/bin/cli.js', ['daemon'])
    await waitForDaemonStarted(daemon)
  })

  after(async function () {
    if (daemon) {
      daemon.kill()
    }
    await rimraf('voyager')
  })

  it('shows the voyager\'s addresses', function () {
    const addresses = execSync('./src/bin/cli.js address')
    const res = addresses.toString().trimRight().split('\n')
    strictEqual(res.length, 4)
  })
})
