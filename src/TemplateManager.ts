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
  blueBright,
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
  version?: string
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

export interface Template {
  type: 'npm' | 'git' | 'dir'
  name: string
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
  async addGit ({ name, path }: GitAddOption) {
    const {
      conf,
    } = this
    if (!name) {
      name = (path.split('\/')
        .pop() || '').replace('\.git', '')
    }
    if (!conf.get(`git.${name}`)) {
      this.git.cwd(`${this.TEMPLATE_HOME}/git`)
      await this.git.clone(path)
      conf.set(`git.${name}`, {
        path,
      })
    } else {
      this.git.cwd(`${this.TEMPLATE_HOME}/git/${name}`)
      await this.git.pull()
    }
  }
  async addNpm (option: NpmAddOption) {
    const ora = Ora(gray(`start adding templates: ${option.name}`))
      .start()
    const [name, version] = option.name.split('@')
    const pkgInfo = await pkgJson(name, { version })
    const realVersion = pkgInfo.version as string || pkgInfo['dist-tags'].latest
    const targetDir = `${this.TEMPLATE_HOME}/npm/te-${name}/v-${realVersion}`
    await fs.mkdirp(targetDir)
    process.chdir(targetDir)
    const templates: Template[] = this.conf.get('templates')
    let target = templates.find(o => o.name === name)
    if (!target) {
      target = {
        type: 'npm',
        name,
        versions: [],
      }
      templates.push(target)
    }
    if (target.versions.findIndex((v: string) => v === realVersion) > -1) {
      ora.warn(yellowBright(`template ${name} version ${realVersion} is already installed`))
      return
    } else {
      target.versions.push(realVersion)
    }
    this.conf.set('templates', templates)
    await execa('npm', ['init', '-y'])
    await execa('npm', ['install', option.name])
    ora.succeed(greenBright(`template ${name} version ${realVersion} is added`))
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
    let suggestVersion = '1.0.0'
    const templates: Template[] = this.conf.get('templates')
    let target = templates.find(o => o.name === name)
    if (!target) {
      target = {
        type: 'dir',
        name,
        versions: [],
      }
      templates.push(target)
    }
    if (target.versions.length > 0) {
      suggestVersion = semver.inc(target.versions.slice(-1)[0], 'patch') || '1.0.0'
    }
    const { iv } = await inquirer.prompt([
      {
        type: 'input',
        name: 'iv',
        message: `✨  ${greenBright('please enter your template version')}`,
        default: suggestVersion,
      },
    ])
    const version = semver.valid(iv)
    if (version) {
      if (target.versions.findIndex(v => v === version) > -1) return Ora(yellowBright(`your template ${name} version ${version} already exists`))
        .warn()
      target.versions.push(version)
      target.versions.sort((a: string, b: string) => (semver.lt(a, b) ? -1 : 1))
      this.conf.set('templates', templates)
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
    } else {
      Ora(yellowBright(`your version ${iv} does not meet the semantic versioning standard`))
        .warn()
    }
  }
}
