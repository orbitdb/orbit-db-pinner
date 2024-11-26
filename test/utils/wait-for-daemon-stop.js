const waitForDaemonStopped = async (daemon) => {
  return new Promise((resolve) => {
    // Wait for the daemon to stop
    daemon.on('close', () => resolve())
  })
}

export default waitForDaemonStopped
