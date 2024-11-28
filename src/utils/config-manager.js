import { promises as fs } from 'fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'path'

const configPath = (path) => join(path, 'config.json')

export const saveConfig = async ({ path, config }) => {
  await mkdir(path, { recursive: true })
  path = configPath(path)
  const data = JSON.stringify(config)

  await fs.writeFile(path, data, { flags: 'w' })
}

export const loadConfig = async ({ path }) => {
  path = configPath(path)

  const config = JSON.parse(await fs.readFile(path))

  return config
}
