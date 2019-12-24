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
import TemplateManager, {
  AddOption,
} from './TemplateManager'
import Ora from './Ora'
import {
  isDir,
  isGitRepo,
  isNpm,
  PromiseQuene,
  PromiseRaceBy,
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
        const ora = Ora('开始分析模板')
          .start()
        const templates = _yargs.argv._.slice(1)
        // PromiseQuene<AddOption>(templates.map(template => () => PromiseRaceBy([
        //   isGitRepo(template),
        //   isNpm(template),
        //   isDir(template),
        // ], f => f)
        //   .then(res => {
        //     console.log(res)
        //   })))
        PromiseQuene<AddOption>(templates.map(template => () => new Promise(r => {
          let i = 0
          isGitRepo(template)
            .then(f => {
              if (f) r({
                type: 'git',
                path: template,
              })
            })
            .catch(e => e)
            .finally(() => {
              if (++i === 3) r({
                disabled: true,
                template,
              })
            })
          isDir(template)
            .then(f => {
              if (f) r({
                type: 'file',
                path: template,
              })
            })
            .catch(e => e)
            .finally(() => {
              if (++i === 3) r({
                disabled: true,
                template,
              })
            })
          isNpm(template)
            .then(f => {
              if (f) r({
                type: 'npm',
                name: template,
              })
            })
            .catch(e => e)
            .finally(() => {
              if (++i === 3) r({
                disabled: true,
                name: template,
              })
            })
        })))
          .then(options => {
            ora.succeed('模板分析完成')
            this.templateManager.addMore(options.filter(o => {
              if (o.disabled) Ora(`未知模板类型：${o.name}`)
                .start()
                .warn()
              return !o.disabled
            }))
          })
      })
      .command(['clean'], 'clean your template dir', async _yargs => {
        const ora = Ora('start clear')
          .start()
        await this.templateManager.clear()
        ora.text = 'clean over'
        ora.succeed()
        process.exit()
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
