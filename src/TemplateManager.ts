import fs from 'fs'
import os from 'os'
import _ from 'lodash'
import del from 'del'
import exec from 'execa'

export default class TemplateManager {
  constructor (private TEMPLATE_HOME: string = `${os.homedir()}/.sagacious`) {
    this.init()
  }
  init () {
    const {
      TEMPLATE_HOME,
    } = this
    if (!fs.existsSync(TEMPLATE_HOME)) fs.mkdirSync(TEMPLATE_HOME, {
      recursive: true,
    })
  }
  clear (sync: boolean) {
    if (sync) return del.sync(this.TEMPLATE_HOME)
    return del(this.TEMPLATE_HOME)
  }
  add (template: string) {
    this.init()
    
  }
}
