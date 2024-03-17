

export default async () => {


  const stop = async () => {
    await orbitdb.stop()
    await ipfs.stop()
  }

  return {
    pins,
    orbitdb,
    stop
  }
}
