import { strictEqual } from 'assert'
import { Access } from '../src/lib/authorization.js'
import { rimraf } from 'rimraf'
import { launchOrbiter } from './utils/launch-orbiter.js'

describe('Authorization', function () {
  let orbiter

  before(async function () {
    orbiter = await launchOrbiter()
  })

  after(async function () {
    await orbiter.shutdown()
    await rimraf('./orbiter')
  })

  it('defaults access to deny all', function () {
    strictEqual(orbiter.auth.defaultAccess, Access.DENY)
  })

  it('sets default access as allow all', function () {
    orbiter.auth.defaultAccess = Access.ALLOW
    strictEqual(orbiter.auth.defaultAccess, Access.ALLOW)
  })

  it('adds an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await orbiter.auth.add(id)

    strictEqual(await orbiter.auth.hasAccess(id), true)
  })

  it('removes an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await orbiter.auth.add(id)
    await orbiter.auth.del(id)
    strictEqual(await orbiter.auth.hasAccess(id), false)
  })
})
