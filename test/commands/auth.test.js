import { exec, execSync } from 'node:child_process'
import { strictEqual } from 'assert'

describe('auth', function () {
  let pid
  before(() => {
    pid = exec('./src/bin/cli.js daemon')
  })

  after(() => {
    pid.kill()
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
})