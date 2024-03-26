import { strictEqual } from 'assert'
import Pinner from '../src/lib/pinner.js'
import { Access } from '../src/lib/authorization.js'
import { rimraf } from 'rimraf'

describe('Authorization', function () {
  let pinner

  before(async function () {
    pinner = await Pinner()
  })

  after(async function () {
    await pinner.stop()
    await rimraf('./pinner')
  })

  it('defaults access to deny all', function () {
    strictEqual(pinner.auth.defaultAccess, Access.DENY)
  })

  it('sets default access as allow all', function () {
    pinner.auth.defaultAccess = Access.ALLOW
    strictEqual(pinner.auth.defaultAccess, Access.ALLOW)
  })

  it('adds an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await pinner.auth.add(id)

    strictEqual(await pinner.auth.hasAccess(id), true)
  })

  it('removes an authorized user', async function () {
    const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
    await pinner.auth.add(id)
    await pinner.auth.del(id)
    strictEqual(await pinner.auth.hasAccess(id), false)
  })
})
