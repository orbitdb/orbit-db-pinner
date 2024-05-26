import { join } from 'path'

export const app = 'voyager'
export const orbiter = 'orbiter'
export const controller = 'controller'

export const orbiterPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(rootDir, app, orbiter)
}

export const controllerPath = (rootDir) => {
  rootDir = rootDir || '.'
  return join(rootDir, app, controller)
}
