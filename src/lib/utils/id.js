import { join } from 'path'

export const app = 'voyager'
export const orbiter = 'orbiter'
export const controller = 'controller'

export const appPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(rootDir, app)
}

export const orbiterPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), orbiter)
}

export const controllerPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(appPath(rootDir), controller)
}
