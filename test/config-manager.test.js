import { deepStrictEqual } from 'assert'
import { saveConfig, loadConfig } from '../src/lib/utils/config-manager.js'
import { rimraf } from 'rimraf'
import { join } from 'path'

describe('Config Manager', function () {
  const path = join('.', 'voyager', 'orbiter')

  afterEach(async function () {
    await rimraf('./voyager')
  })

  it('saves and loads config', async function () {
    const expectedConfig = {
      setting1: 'abc',
      setting2: 'xyz',
      setting3: {
        settingA: [
          '123'
        ]
      }
    }

    await saveConfig({ path, config: expectedConfig })
    const config = await loadConfig({ path })
    deepStrictEqual(config, expectedConfig)
  })

  it('overwrites old config with new config', async function () {
    const oldConfig = {
      setting1: 'abc',
      setting2: 'xyz',
      setting3: {
        settingA: [
          '123'
        ]
      }
    }

    const expectedConfig = {
      setting1: 'cba',
      setting2: 'zyx',
      setting3: {
        settingA: [
          '321'
        ]
      }
    }

    await saveConfig({ path, config: oldConfig })
    let config = await loadConfig({ path })
    deepStrictEqual(config, oldConfig)

    await saveConfig({ path, config: expectedConfig })
    config = await loadConfig({ path })
    deepStrictEqual(config, expectedConfig)
  })
})
