#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import daemon from '../daemon.js'
import RPC from '../rpc-client.js'
import { Responses } from '../lib/messages/index.js'

yargs(hideBin(process.argv))
  .scriptName('voyager')
  .command(
    'daemon',
    'Launch Voyager',
    yargs => {
      yargs
        .option('port', {
          alias: 'p',
          description: 'The port to listen on. Defaults to 0.',
          type: 'number'
        })
        .option('wsport', {
          alias: 'w',
          description: 'The port to listen on for WebSockets. Defaults to 0.',
          type: 'number'
        })
    },
    async (argv) => {
      argv.directory = process.env.VOYAGER_PATH || argv.directory
      await daemon({ options: argv })
    })
  .command(
    'id',
    'Show the voyager\'s id',
    () => {},
    async argv => {
      argv.directory = process.env.VOYAGER_PATH || argv.directory
      const { getId } = await RPC(argv)
      const res = await getId()
      if (res.type === Responses.OK) {
        console.log(res.message)
        process.exit(0)
      } else {
        console.error(res)
        process.exit(1)
      }
    })
  .command(
    'address',
    'Show the voyager\'s network addresses',
    () => {},
    async argv => {
      argv.directory = process.env.VOYAGER_PATH || argv.directory
      const { getAddress } = await RPC(argv)
      const res = await getAddress()
      if (res.type === Responses.OK) {
        for (const addr of res.message) {
          console.log(addr)
        }
        process.exit(0)
      } else {
        console.error(res)
        process.exit(1)
      }
    })
  .command('auth', 'Add or remove authorized user', yargs => {
    yargs
      .command(
        'add <id>',
        'Add an authorized user',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who is allowed to add one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          argv.directory = process.env.VOYAGER_PATH || argv.directory
          const { authAdd } = await RPC(argv)
          const res = await authAdd(argv)
          if (res.type === Responses.OK) {
            console.log('ok')
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .command(
        'del <id>',
        'Remove an authorized user',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who will no longer be allowed to add one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          argv.directory = process.env.VOYAGER_PATH || argv.directory
          const { authDel } = await RPC(argv)
          const res = await authDel(argv)
          if (res.type === Responses.OK) {
            console.log('ok')
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .command(
        'list',
        'List authorized users',
        () => {},
        async argv => {
          argv.directory = process.env.VOYAGER_PATH || argv.directory
          const { authList } = await RPC(argv)
          const res = await authList()
          if (res.type === Responses.OK) {
            for (const id of res.message) {
              console.log(id)
            }
            process.exit(0)
          } else {
            console.error(res)
            process.exit(1)
          }
        })
      .demandCommand(1, 'Error: use add or remove')
  })
  .option('verbose', {
    alias: 'v',
    description: 'Be more verbose. Outputs errors and other connection messages. Use multiple -vvv for more verbose logging.',
    type: 'count'
  })
  .option('directory', {
    alias: 'd',
    type: 'string',
    description: 'Specify a directory to store Voyager, IPFS and OrbitDB data. You can also use VOYAGER_PATH environment variable to specify the directory.'
  }).option('allow', {
    alias: 'a',
    type: 'boolean',
    description: 'Allow anyone to add a database. The default is false.'
  })
  .demandCommand(1, 'Error: specify a command.')
  .help()
  .alias('h', 'help')
  .parse()
