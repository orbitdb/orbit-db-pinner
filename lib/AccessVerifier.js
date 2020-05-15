const { Identities } = require('orbit-db')


class IdentityVerifier {
  static get type() { return 'tallylab' }
}

Identities.addIdentityProvider(IdentityVerifier)

class AccessVerifier {
  static get type () { return 'tallylab' }
  get type () { return this.constructor.type }
  canAppend(entry, identityProvider) { return true }

  static async create (orbitdb, options) {
    const identities = new Identities({})
    return new AccessVerifier(orbitdb, identities, options)
  }

  load() { return {} }
}

module.exports = AccessVerifier
