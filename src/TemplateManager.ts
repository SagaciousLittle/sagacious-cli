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
  gray,
  greenBright,
} from 'chalk'

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
  addNpm (option: NpmAddOption) {
    const ora = Ora(greenBright(`start adding templates: ${option.name}`))
      .start()
    const targetDir = `${this.TEMPLATE_HOME}/npm/te-${option.name}`
    fs.mkdirpSync(targetDir)
    process.chdir(targetDir)
    return execa('npm', ['init', '-y'])
      .then(() => execa('npm', ['install', option.name]))
      .then(() => {
        ora.succeed(greenBright(`template ${option.name} is added`))
        const templates = this.conf.get('template') || []
        if (templates.findIndex((o: AddOption) => o.name === option.name) > -1) return
        this.conf.set('template', [
          ...templates,
          {
            type: 'npm',
            name: option.name,
          },
        ])
      })
  }
  addFile (option: FileAddOption) {
    console.log(option)
  }
}
