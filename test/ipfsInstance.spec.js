const assert = require('assert')

describe('ipfsInstance', function () {
  let ipfsInstance

  this.timeout(10000)

  before(async () => {
    ipfsInstance = await require('../lib/ipfsInstance')
  })

  it('returns a proper ipfs instance with default config', async () => {
    const expected = ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
    assert.deepStrictEqual(await ipfsInstance.config.get('Addresses.Swarm'), expected)
  })

  after(async () => {
    await ipfsInstance.stop()
  })
})
