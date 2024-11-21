const waitForDaemonStarted = async (daemon) => {
  return new Promise((resolve) => {
    // Wait for the daemon to start which is when the daemon has printed "started" in stdout
    const onStdout = (data) => (data.toString().trimRight() === 'started') ? resolve() : {}
    daemon.stdout.on('data', onStdout)
  })
}

export default waitForDaemonStarted
