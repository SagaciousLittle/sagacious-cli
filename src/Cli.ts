import {
  version,
} from '../package.json'


/**
 * 脚手架
 *
 * @class Cli
 */
class Cli {
  static version = version

  static _cli?: Cli

  static get () {
    if (!this._cli) {
      this._cli = new this()
      console.log('没有')
    }
    return this._cli
  }
  
  /**
   * 开始执行
   *
   * @memberof Cli
   */
  run () {

  }

  /**
   * 检查版本是否最新
   *
   * @memberof Cli
   */
  checkVersion () {
    return false
  }

  /**
   * 下载模板
   *
   * @memberof Cli
   */
  downloadTemplate () {

  }

  /**
   * 生成目录
   *
   * @memberof Cli
   */
  generator () {

  }
}

export default Cli
