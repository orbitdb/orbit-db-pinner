#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { init, daemon, authAdd, authDel, authList } from './lib/commands/index.js'

yargs(hideBin(process.argv))
  .scriptName('voyager')
  .command(
    'init',
    'Initialize Voyager',
    () => {},
    async argv => {
      await init(argv)
      process.exit(0)
    }
  ).command(
    'daemon',
    'Launch Voyager',
    () => {},
    argv => {
      daemon(argv)
    })
  .command('auth', 'Add/remove authorized addresses', yargs => {
    yargs
      .command(
        'add <id>',
        'Add an authorized address',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who is allowed to pin one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          await authAdd(argv)
          process.exit(0)
        })
      .command(
        'del <id>',
        'Remove an authorized address',
        yargs => {
          yargs.positional('id', {
            describe: 'The id of the user who will no longer be allowed to pin one or more databases (or denied depending on default access settings).',
            type: 'string'
          })
        },
        async argv => {
          await authDel(argv)
          process.exit(0)
        })
      .command(
        'list',
        'List authorized addresses',
        () => {},
        async argv => {
          await authList(argv)
          process.exit(0)
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
    description: 'Specify a directory to store IPFS and OrbitDB data.'
  }).option('allow', {
    alias: 'a',
    type: 'boolean',
    description: 'Allow anyone to pin a database. The default is false.'
  })
  .demandCommand(1, 'Error: specify a command.')
  .help()
  .parse()
