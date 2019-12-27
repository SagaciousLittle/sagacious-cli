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

interface baseAddOption {
  type: string
  name: string
  disabled?: boolean
}

interface NpmAddOption extends baseAddOption {
  type: 'npm'
}

interface GitAddOption extends baseAddOption {
  type: 'git'
  path: string
}

interface DirAddOption extends baseAddOption {
  type: 'dir'
  path: string
}

export type AddOption = NpmAddOption | GitAddOption | DirAddOption

type TemplateType = 'npm' | 'git' | 'dir'

export interface Template {
  type: TemplateType
  name: string
  path?: string
  versions: string[]
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
  add (option: AddOption) {
    switch (option.type) {
    case 'git':
      return this.addGit(option)
    case 'npm':
      return this.addNpm(option)
    case 'dir':
      return this.addDir(option)
    }
  }
  addMore (options: AddOption[]) {
    return PromiseQuene(options.map(o => () => this.add(o) || Promise.resolve()))
      .then(() => {
        process.exit()
      })
  }
  async addGit (option: GitAddOption) {
    const gitName = /\S+\.git/.test(option.name) ? (option.path.split('\/')
      .pop() || '').replace('\.git', '') : option.name
    const { name } = await inquirer
      .prompt([
        {
          type: 'input',
          name: 'name',
          message: `✨  ${greenBright('please enter your template name')}`,
          default: gitName,
        },
      ])
    try {
      const version = await this.addConf('git', name)
      const ora = Ora(gray(`start adding templates: ${name}`))
        .start()
      const targetDir = `${this.TEMPLATE_HOME}/git/te-${name}/v-${version}`
      await fs.mkdirp(targetDir)
      this.git.cwd(targetDir)
      await this.git.clone(option.path)
      ora.succeed(greenBright(`template ${name} version ${version} is added`))
    } catch (e) {
      Ora(yellowBright(e.message))
        .warn()
    }
  }
  async addNpm (option: NpmAddOption) {
    const [name] = option.name.split('@')
    try {
      const version = await this.addConf('npm', name)
      const ora = Ora(gray(`start adding templates: ${option.name}`))
        .start()
      const targetDir = `${this.TEMPLATE_HOME}/npm/te-${name}/v-${version}`
      await fs.mkdirp(targetDir)
      process.chdir(targetDir)
      await execa('npm', ['init', '-y'])
      await execa('npm', ['install', option.name])
      ora.succeed(greenBright(`template ${name} version ${version} is added`))
    } catch (e) {
      Ora(yellowBright(e.message))
        .warn()
    }
  }
  async addDir (option: DirAddOption) {
    const templatePath = resolve(option.path)
    const dirName = templatePath
      .split('\\')
      .pop()
    const { name } = await inquirer
      .prompt([
        {
          type: 'input',
          name: 'name',
          message: `✨  ${greenBright('please enter your template name')}`,
          default: dirName,
        },
      ])
    const version = await this.addConf('dir', name)
    const ora = Ora(gray(`start adding templates: ${name}`))
      .start()
    const targetDir = `${this.TEMPLATE_HOME}/dir/te-${name}/v-${version}`
    await fs.mkdirp(targetDir)
    process.chdir(templatePath)
    const ignores = [
      'node_modules',
    ]
    const files = (await fs.readdir('.')).filter(o => !ignores.includes(o))
    await Promise.all(files.map(f => fs.copy(`${templatePath}/${f}`, `${targetDir}/${f}`)))
    ora.succeed(greenBright(`template ${name} version ${version} is added`))
  }
  async addConf (type: TemplateType, name: string) {
    let suggestVersion = '1.0.0'
    const templates: Template[] = this.conf.get('templates')
    let target = templates.find(o => o.name === name && o.type === type)
    if (!target) {
      target = {
        type,
        name,
        versions: [],
      }
      templates.push(target)
    }
    if (target.versions.length > 0) {
      suggestVersion = semver.inc(target.versions.slice(-1)[0], 'patch') || '1.0.0'
    }
    let [, version] = name.split('@') as any
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
      const pkgInfo = await pkgJson(name, { version })
      version = pkgInfo.version as string || pkgInfo['dist-tags'].latest
    }
    if (version) {
      if (target.versions.findIndex(v => v === version) > -1) throw new Error(`your template ${name} version ${version} already exists`)
      target.versions.push(version)
      target.versions.sort((a: string, b: string) => (semver.lt(a, b) ? -1 : 1))
      this.conf.set('templates', templates)
    } else {
      throw new Error(`your version ${version} does not meet the semantic versioning standard`)
    }
    return version
  }
  removeConf (type: TemplateType, name: string, version: string) {
    const templates: Template[] = this.conf.get('templates')
    const targetIndex = templates.findIndex(template => template.name === name && template.type === type)
    const target = templates[targetIndex]
    if (!target) return
    const versionIndex = target.versions.findIndex(v => v === version)
    if (versionIndex < 0) return
    target.versions.splice(versionIndex, 1)
    if (target.versions.length === 0) templates.splice(targetIndex, 1)
    this.conf.set('templates', templates)
  }
}
