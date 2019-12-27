import {
  version,
} from '../package.json'
import inquirer from 'inquirer'
import {
  yellowBright,
  greenBright,
  blueBright,
  gray,
  cyan,
} from 'chalk'
import yargs from 'yargs'
import TemplateManager, {
  AddOption,
  Template,
} from './TemplateManager'
import Ora from './Ora'
import {
  isDir,
  isGitRepo,
  isNpm,
  PromiseQuene,
  PromiseRaceBy,
  printLogo,
} from './Util'

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

  templateManager = new TemplateManager()

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
        const templates = _yargs.argv._.slice(1)
        printLogo()
        const ora = Ora(gray('start analyzing templates'))
          .start()
        PromiseQuene<AddOption>(templates.map(name => () => PromiseRaceBy([
          isGitRepo(name),
          isNpm(name),
          isDir(name),
        ], f => f)
          .then(res => {
            let type = ''
            let disabled = false
            switch (res.i) {
            case 0:
              type = 'git'
              break
            case 1:
              type = 'npm'
              break
            case 2:
              type = 'dir'
              break
            default:
              disabled = true
            }
            return { path: name, name, type, disabled }
          })))
          .then(options => {
            ora.succeed(greenBright('template analysis completed'))
            this.templateManager.addMore(options.filter(o => {
              if (o.disabled) Ora(yellowBright(`unknown template type: ${o.name}`))
                .start()
                .warn()
              return !o.disabled
            }))
          })
      })
      .command(['clean'], 'clean your template dir', async _yargs => {
        _yargs.parse()
        printLogo()
        const ora = Ora('start clear')
          .start()
        await this.templateManager.clear()
        ora.succeed(greenBright('clean over'))
        process.exit()
      })
      .command(['check'], 'check your config file', _yargs => {
        _yargs.parse()
        const templates: Template[] = this.templateManager.conf.get('templates')
        printLogo()
        console.log(cyan(`you have a total of ${templates.length} templates`))
        templates.forEach(({ name, path, type, versions }) => {
          console.log(`\n${greenBright(name)}\ntype: ${greenBright(type)}\n${path ? `path: ${greenBright(path)}\n` : ''}versions: ${greenBright(versions.map((v, i) => {
            if (i === versions.length - 1) return v
            else return `${v} | `
          })
            .join(''))}`)
        })
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
