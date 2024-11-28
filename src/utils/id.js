import { join } from 'path'

export const app = 'voyager'
export const orbiter = 'orbiter'
export const rpc = 'rpc'

export const appPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(rootDir, app)
}

export const orbiterPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), orbiter)
}

export const rpcPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), rpc)
}
