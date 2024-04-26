import Orbiter from './lib/orbiter.js'

const main = async () => {
  const orbiter = await Orbiter()

  console.log(orbiter.registry.orbitdb.ipfs.libp2p.getMultiaddrs())

  process.on('SIGINT', async () => {
    await orbiter.stop()
    process.exit(0)
  })
}

main()
