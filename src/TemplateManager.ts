import fs from 'fs-extra'
import os from 'os'
import _ from 'lodash'
import del from 'del'
import Conf from 'conf'
import Git from 'simple-git/promise'
import execa from 'execa'
import Ora from './Ora'
import {
  PromiseQuene,
} from './Util'
import {
  greenBright,
  yellowBright,
  gray,
} from 'chalk'
import pkgJson from 'package-json'
import inquirer from 'inquirer'
import {
  resolve,
} from 'path'
import semver from 'semver'

type TemplateType = 'npm' | 'git' | 'dir'

export interface Template {
  type: TemplateType
  name: string
  path?: string
  versions: {
    version: string
    finish: boolean
  }[]
}

export interface AddOption {
  type: TemplateType
  name: string
  path: string
  disabled?: boolean
}

interface Add {
  init: () => Promise<string | undefined>
  exec: (targetDir: string) => Promise<void>
}

export default class TemplateManager {
  conf: Conf
  private git = Git()
  constructor (private TEMPLATE_HOME: string = `${os.homedir()}/.sagacious/cli`) {
    if (!fs.existsSync(TEMPLATE_HOME)) fs.mkdirpSync(TEMPLATE_HOME)
    this.conf = new Conf({
      cwd: TEMPLATE_HOME,
    })
    if (!this.conf.get('templates')) this.conf.set('templates', [])
  }
  initDefault () {
    
  }
  clear () {
    return del(this.TEMPLATE_HOME, {
      force: true,
    })
  }
  async remove (type: TemplateType, name: string, version?: string) {
    let targetDir = `${this.TEMPLATE_HOME}/${type}/te-${name}`
    if (version) targetDir += `/v-${version}`
    await del(targetDir)
    this.removeConf(type, name, version)
  }
  addMore (options: AddOption[]) {
    return PromiseQuene(options.map(o => () => this.add(o) || Promise.resolve()))
      .then(() => {
        process.exit()
      })
  }
  async add (option: AddOption) {
    try {
      const {
        type,
      } = option
      let fn: (option: AddOption) => Add
      switch (type) {
      case 'git':
        fn = this.addGit
        break
      case 'npm':
        fn = this.addNpm
        break
      case 'dir':
        fn = this.addDir
        break
      }
      const { init, exec } = fn.call(this, option)
      let name = type !== 'npm' ? (await inquirer
        .prompt([
          {
            type: 'input',
            name: 'askName',
            message: `✨  ${greenBright('please enter your template name')}`,
            default: await init(),
          },
        ])).askName : option.name
      if (!name) throw new Error('the name should be set to an explicit value')
      const [version, templates, target] = await this.addConf(type, name)
      const ora = Ora(gray(`start adding templates: ${name}`))
        .start()
      const targetDir = `${this.TEMPLATE_HOME}/${type}/te-${name}/v-${version}`
      await fs.mkdirp(targetDir)
      await exec(targetDir)
      target.finish = true
      this.conf.set('templates', templates)
      ora.succeed(greenBright(`template ${name} version ${version} is added`))
    } catch (e) {
      Ora(yellowBright(e.message))
        .warn()
    }
  }
  addGit (option: AddOption) {
    const init = async () => (/\S+\.git/.test(option.name) ? (option.path.split('\/')
      .pop() || '').replace('\.git', '') : option.name)
    const exec = async (targetDir: string) => {
      this.git.cwd(targetDir)
      await this.git.clone(option.path)
    }
    return { init, exec }
  }
  addNpm (option: AddOption) {
    const init = async () => {
      const [name] = option.name.split('@')
      return name
    }
    const exec = async (targetDir: string) => {
      const execPath = process.cwd()
      process.chdir(resolve(targetDir))
      await execa('npm', ['init', '-y'])
      await execa('npm', ['install', option.name])
      process.chdir(resolve(execPath))
    }
    return { init, exec }
  }
  addDir (option: AddOption) {
    const templatePath = resolve(option.path)
    const init = async () => templatePath
      .split('\\')
      .pop()
    const exec = async (targetDir: string) => {
      const ignores = [
        'node_modules',
      ]
      const files = (await fs.readdir(templatePath)).filter(o => !ignores.includes(o))
      await Promise.all(files.map(f => fs.copy(`${templatePath}/${f}`, `${targetDir}/${f}`)))
    }
    return { init, exec }
  }
  async addConf (type: TemplateType, name: string) {
    let suggestVersion = '1.0.0'
    let [realName, version] = name.split('@') as any
    const templates: Template[] = this.conf.get('templates')
    let target = templates.find(o => o.name === realName && o.type === type)
    if (!target) {
      target = {
        type,
        name: realName,
        versions: [],
      }
      templates.push(target)
    }
    if (target.versions.length > 0) {
      suggestVersion = semver.inc(target.versions.slice(-1)[0].version, 'patch') || '1.0.0'
    }
    if (type !== 'npm') {
      const { iv } = await inquirer.prompt([
        {
          type: 'input',
          name: 'iv',
          message: `✨  ${greenBright('please enter your template version')}`,
          default: suggestVersion,
        },
      ])
      version = semver.valid(iv)
    } else {
      const pkgInfo = await pkgJson(realName, { version })
      version = pkgInfo.version as string || pkgInfo['dist-tags'].latest
    }
    let targetVersion
    if (version) {
      if (target.versions.findIndex(v => v.version === version) > -1) throw new Error(`your template ${name} version ${version} already exists`)
      targetVersion = {
        finish: false,
        version,
      }
      target.versions.push(targetVersion)
      target.versions.sort((a, b) => (semver.lt(a.version, b.version) ? -1 : 1))
      this.conf.set('templates', templates)
    } else {
      throw new Error(`your version ${version} does not meet the semantic versioning standard`)
    }
    return [version, templates, targetVersion]
  }
  removeConf (type: TemplateType, name: string, version?: string) {
    const templates: Template[] = this.conf.get('templates')
    const targetIndex = templates.findIndex(template => template.name === name && template.type === type)
    const target = templates[targetIndex]
    if (!target) return
    if (version) {
      const versionIndex = target.versions.findIndex(v => v.version === version)
      if (versionIndex < 0) return
      target.versions.splice(versionIndex, 1)
    }
    if (!version || target.versions.length === 0) templates.splice(targetIndex, 1)
    this.conf.set('templates', templates)
  }
}
