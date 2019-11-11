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
    if (!this._cli) this._cli = new this()
    return this._cli
  }
  
  /**
   * help
   *
   * @memberof Cli
   */
  help () {
    console.log(`Usage: sag <command> [options]

      Options:
        -v, --version                              output the version number
        -h, --help                                 output usage information
      
      Commands:
        create [options] <app-name>                create a new project by this app-name
        add [options] <plugin> [pluginOptions]     install a sag-template
      
        Run sag <command> --help for detailed usage of given command.`)
  }
}

export default Cli
