import { Set } from '@orbitdb/set-db'
import { useDatabaseType } from '@orbitdb/core'

export const Access = Object.freeze({
  ALLOW: 1,
  DENY: 2
})

export default ({ orbitdb, defaultAccess }) => {
  defaultAccess = defaultAccess || Access.DENY

  useDatabaseType(Set)

  const add = async (id) => {
    const access = await orbitdb.open('access', { type: 'set' })
    await access.add(id)
    await access.close()
  }

  const del = async (id) => {
    const access = await orbitdb.open('access', { type: 'set' })
    await access.del(id)
    await access.close()
  }

  const hasAccess = async (id) => {
    let found = false

    const access = await orbitdb.open('access', { type: 'set' })

    // @TODO is there a database which stores unique values + can get by value?
    // @TODO add has(value) function to SetDB
    for await (const a of access.iterator()) {
      if (a.value === id) {
        found = true
        break
      }
    }

    await access.close()

    return defaultAccess === Access.DENY ? found : !found
  }

  const all = async () => {
    const access = await orbitdb.open('access', { type: 'set' })
    const all = await access.all()
    await access.close()

    return all
  }

  return {
    defaultAccess,
    add,
    del,
    hasAccess,
    all
  }
}
