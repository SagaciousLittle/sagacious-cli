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

interface FileAddOption extends baseAddOption {
  type: 'file'
  path: string
}

export type AddOption = NpmAddOption | GitAddOption | FileAddOption

export default class TemplateManager {
  conf: Conf
  private git = Git()
  constructor (private TEMPLATE_HOME: string = `${os.homedir()}/.sagacious/cli`) {
    if (!fs.existsSync(TEMPLATE_HOME)) fs.mkdirpSync(TEMPLATE_HOME)
    this.conf = new Conf({
      cwd: TEMPLATE_HOME,
    })
    if (!this.conf.get('template')) this.conf.set('template', [])
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
    case 'file':
      return this.addFile(option)
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
    const realVersion = pkgInfo.version || pkgInfo['dist-tags'].latest
    const targetDir = `${this.TEMPLATE_HOME}/npm/te-${name}/v-${realVersion}`
    fs.mkdirpSync(targetDir)
    process.chdir(targetDir)
    const templates = this.conf.get('template')
    let target = templates.find((o: AddOption) => o.name === name)
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
    this.conf.set('template', templates)
    await execa('npm', ['init', '-y'])
    await execa('npm', ['install', option.name])
    ora.succeed(greenBright(`template ${name} version ${realVersion} is added`))
  }
  addFile (option: FileAddOption) {
    console.log(option)
  }
}
