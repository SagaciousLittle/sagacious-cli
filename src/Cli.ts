import {
  version,
} from '../package.json'
import inquirer from 'inquirer'
import {
  yellowBright,
  greenBright,
  blueBright,
} from 'chalk'
import yargs from 'yargs'


/**
 * 脚手架
 *
 * @class Cli
 */
class Cli {
  static version = version

  static _cli?: Cli

  static get () {
    if (!this._cli) this._cli = new this()
    return this._cli
  }

  version = version

  _args: {
    [x: string]: unknown
    $0: string
    _: string[]
  } = { $0: '', _: [] }

  run () {
    const _ = yargs
      .locale('en')
      .usage(greenBright('usage: $0 create <app-name>'))
      .usage(greenBright('usage: $0 add <template-name> <template-name> ...'))
      .alias('v', 'version')
      .alias('h', 'help')
      .example('example', 'example')
      .epilog(`Run ${blueBright('sag <command> --help')} for detailed usage of given command.`)
      .command(['create', 'c'], 'create a project based on the template', _yargs => {
        let [command, appName] = _yargs.argv._
        this.create(appName)
      })
      .command(['add', 'a'], 'install the sag template locally', _yargs => {
        console.log(_yargs.argv)
      })
      .showHelpOnFail(true)
    const _args = _.parse()
    if (_args._.length === 0) _.showHelp()
    this._args = _args
  }
  async create (appName?: string) {
    console.log(blueBright(`Sag CLI v${this.version}`))
    const dirName = process.cwd()
      .split('\\')
      .pop()
    let res = { appName }
    if (!appName) res = await inquirer.prompt([
      {
        type: 'input',
        name: 'appName',
        message: `✨  ${greenBright(`please enter your project name (${dirName})`)}`,
      },
    ])
    if (!res.appName || !res.appName.trim()) res.appName = dirName
    console.log(res.appName)
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'template',
          message: 'please select the template you want to use.',
          choices: [
            {
              name: `namea (${yellowBright('router')}, ${yellowBright('eslint')})`,
              value: 'valuea',
            },
            {
              name: 'nameb',
              value: 'valueb',
            },
            {
              name: 'namec',
              value: 'valuec',
            },
          ],
        },
      ])
      .then(res => {
        console.log(res)
      })
  }
}

export default Cli
