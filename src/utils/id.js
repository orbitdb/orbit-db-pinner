import { join } from 'path'

export const app = 'voyager'
export const host = 'host'
export const rpc = 'rpc'

export const appPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(rootDir, app)
}

export const hostPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), host)
}

export const rpcPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), rpc)
}
