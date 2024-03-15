import { Set } from '@orbitdb/set-db'
import { useDatabaseType } from '@orbitdb/core'

export const Access = Object.freeze({
  ALLOW: 1,
  DENY: 2
})

export default async ({ orbitdb, defaultAccess }) => {
  defaultAccess = defaultAccess || Access.DENY
  
  useDatabaseType(Set)

  const access = await orbitdb.open('access', { type: 'set' })

  const add = async (id) => {
    await access.add(id)
  }

  const del = async (id) => {
    await access.del(id)
  }

  const hasAccess = async (id) => {
    let found = false

    // @TODO is there a database which stores unique values + can get by value?
    for await (const a of access.iterator()) {
      if (a.value === id) {
        found = true
        continue
      }
    }

    return defaultAccess === Access.DENY ? found : !found
  }

  return {
    defaultAccess,
    add,
    del,
    hasAccess
  }
}
