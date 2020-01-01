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
  printHello,
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
      .usage(greenBright('usage: $0 add <npm-package> <git-repository> <local-folder> ...'))
      .alias('v', 'version')
      .alias('h', 'help')
      .example('example', 'example')
      .epilog(`Run ${blueBright('sag <command> --help')} for detailed usage of given command.`)
      .command(['create', 'c'], 'create a project based on the template', _yargs => {
        let [, appName] = _yargs.argv._
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
              if (o.disabled) Ora(yellowBright(`unknown template type: ${o.name}${o.name.endsWith('\.git')  && ', please check if your repository is private'}`))
                .warn()
              return !o.disabled
            }))
          })
      })
      .command(['remove', 'r'], 'remove your template dir', async _yargs => {
        _yargs
          .option('a', {
            alias: 'all',
            describe: 'remove all',
            type: 'boolean',
          })
        if (yargs.parse().all) {
          printLogo()
          const ora = Ora('start clear')
            .start()
          await this.templateManager.clear()
          ora.succeed(greenBright('remove over'))
        } else {
          const targets = yargs.parse()._.slice(1)
          if (targets.length === 0) return _yargs.showHelp()
          printLogo()
          for (let i = 0; i < targets.length; i++) {
            const target = targets[i]
            let [name, version, scopedVersion] = target.split('@')
            if (!name) {
              name = `@${version}`
              version = scopedVersion
            }
            const templates: Template[] = this.templateManager.getAll()
            let targetTemplates = templates.filter(template => template.name === name && (!version || template.versions.find(o => o.version === version)))
            if (targetTemplates.length === 0) {
              Ora(yellowBright(`can't find template: ${target}`))
                .warn()
            }
            if (targetTemplates.length > 1) {
              targetTemplates = (await inquirer.prompt({
                type: 'checkbox',
                name: 'value',
                message: greenBright(`template ${name} ${version ? `version ${version} ` : ''}discover more types of template, you should choose a type`),
                default: targetTemplates[0].type,
                choices: targetTemplates.map(o => ({
                  name: o.type,
                  value: o,
                })),
              })).value
            }
            await Promise.all(targetTemplates.map(target => this.templateManager.remove(target.type, name, version)))
            Ora('remove over')
              .succeed()
          }
          process.exit()
        }
      })
      .command(['check'], 'check your config file', _yargs => {
        _yargs.parse()
        const templates = (this.templateManager.getAll() as Template[]).filter(template => {
          template.versions = template.versions.filter(v => v.finish)
          return template.versions.length > 0
        })
        printLogo()
        console.log(cyan(`you have a total of ${templates.length} templates`))
        templates.forEach(({ name, path, type, versions }) => {
          console.log(`\n${greenBright(name)}\ntype: ${greenBright(type)}\n${path ? `path: ${greenBright(path)}\n` : ''}versions: ${greenBright(versions.map((o, i) => {
            const v = o.version
            if (i === versions.length - 1) return v
            else return `${v} | `
          })
            .join(''))}`)
        })
      })
      .command(['hello'], 'say hello to the world', () => {
        printHello()
      })
      .showHelpOnFail(true)
    const _args = _.parse()
    if (_args._.length === 0) _.showHelp()
    this._args = _args
  }
  async create (appName?: string) {
    printLogo()
    const templates = this.templateManager.getAll()
    if (templates.length === 0) return Ora(yellowBright('please add a template first'))
      .warn()
    console.log(blueBright(`Sag CLI v${this.version}`))
    const dirName = process.cwd()
      .split('\\')
      .pop()
    let res = { appName }
    if (!appName) res = await inquirer.prompt([
      {
        type: 'input',
        name: 'appName',
        message: `✨  ${greenBright('please enter your project name')}`,
        default: dirName,
      },
    ])
    if (!res.appName || !res.appName.trim()) res.appName = dirName
    const target: Template = (await inquirer.prompt({
      type: 'list',
      message: `✨  ${greenBright('please choose your template')}`,
      choices: templates.map(template => ({
        name: `${template.name}${templates.filter(t => t.name === template.name).length > 1 ? `(${template.type})` : ''}`,
        value: template,
      })),
      name: 'targetTemplate',
    })).targetTemplate
    const version = target.versions.length === 1 ? target.versions[0].version : (await inquirer.prompt({
      type: 'list',
      message: `✨  ${greenBright('please choose your version')}`,
      choices: target.versions.map(v => ({
        name: v.version,
        value: v.version,
      })),
      name: 'targetVersion',
    })).targetVersion
    await this.templateManager.clone(appName || '', target.type, target.name, version, process.cwd())
  }
}

export default Cli
