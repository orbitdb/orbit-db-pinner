import Pinner from './lib/pinner.js' 

const main = async () => {  
  const pinner = await Pinner()
  
  console.log(pinner.registry.orbitdb.ipfs.libp2p.getMultiaddrs())
  
  process.on('SIGINT', async () => {
    await pinner.stop()
    process.exit(0)
  })
}

main()