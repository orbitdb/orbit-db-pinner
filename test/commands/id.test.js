import { spawn, execSync } from 'node:child_process'
import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import waitForDaemonStarted from '../utils/wait-for-daemon-start.js'
import waitForDaemonStopped from '../utils/wait-for-daemon-stop.js'

describe('Commands - id', function () {
  let daemon
  let id

  const directory = 'abc'

  before(async function () {
    daemon = spawn('./src/bin/cli.js', ['daemon', '-d', directory])
    await waitForDaemonStarted(daemon)
    id = execSync(`./src/bin/cli.js id -d ${directory}`)
    daemon.kill()
    await waitForDaemonStopped(daemon)

    daemon = spawn('./src/bin/cli.js', ['daemon', '-d', directory])
    await waitForDaemonStarted(daemon)
  })

  after(async function () {
    if (daemon) {
      daemon.kill()
    }
    await rimraf('abc')
  })

  it('gets the voyager id', function () {
    const res = execSync(`./src/bin/cli.js id -d ${directory}`)
    strictEqual(res.toString(), id.toString())
  })

  it('gets the voyager id - using VOYAGER_PATH', function () {
    const res = execSync(`VOYAGER_PATH=${directory} ./src/bin/cli.js id`)
    strictEqual(res.toString(), id.toString())
  })
})
