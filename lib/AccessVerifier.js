class AccessVerifier {
  static get type () { return 'tallylab' }

  get type () {
    return this.constructor.type
  }

  async canAppend(entry, identityProvider) {
    return true
  }
}

module.exports = AccessVerifier
