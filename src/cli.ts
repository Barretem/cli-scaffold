import * as minimist from 'minimist'

import { getPkgVersion } from './utils'

export default class CLI {
  appPath: string
  constructor (appPath) {
    this.appPath = appPath || process.cwd()
  }

  run () {
    return this.parseArgs()
  }

  async parseArgs () {
    const args = minimist(process.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
        add: ['add'], // add 命令
      },
      boolean: ['version', 'help'],
      default: {
        build: true,
      },
    })
    // 参数列表
    const _ = args._
    const command = _[0]
    if (command) {
      switch (command) {
        case 'add': {
          break
        }
        default:
          break
      }
    } else {
      if (args.h) {
        console.log('Usage: spass <command> [options]')
        console.log()
        console.log('Options:')
        console.log('  -v, --version       output the version number')
        console.log('  -h, --help          output usage information')
        console.log()
        console.log('Commands:')
        console.log('  add [moduleName]  add a module')
      } else if (args.v) {
        console.log(getPkgVersion())
      }
    }
  }
}
