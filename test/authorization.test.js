import { strictEqual } from 'assert'
import { Access } from '../src/lib/authorization.js'
import { rimraf } from 'rimraf'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'

describe('Authorization', function () {
  let host

  before(async function () {
    host = await launchVoyagerHost()
  })

  after(async function () {
    await host.shutdown()
    await rimraf('./host')
  })

  it('defaults access to deny all', function () {
    strictEqual(host.auth.defaultAccess, Access.DENY)
  })

  it('sets default access as allow all', function () {
    host.auth.defaultAccess = Access.ALLOW
    strictEqual(host.auth.defaultAccess, Access.ALLOW)
  })

  it('adds an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await host.auth.add(id)

    strictEqual(await host.auth.hasAccess(id), true)
  })

  it('removes an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await host.auth.add(id)
    await host.auth.del(id)
    strictEqual(await host.auth.hasAccess(id), false)
  })
})
