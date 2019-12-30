import dayjs from 'dayjs'
import figlet from 'figlet'
import {
  gray,
  cyanBright,
} from 'chalk'
import execa from 'execa'
import fs from 'fs-extra'
import {
  resolve,
} from 'path'
import os from 'os'

export const LOGO = 'sagacious'

/**
 * log function
 *
 * @export
 * @param {string} message
 */
export function log (message: string) {
  console.log(`[${gray(dayjs()
    .format('HH:mm:ss'))}] - ${message}`)
}

/**
 * print logo
 *
 * @export
 */
export function printLogo () {
  console.clear()
  console.log(cyanBright(`${figlet.textSync(LOGO)}\n`))
}

/**
 * say hello to the world
 *
 * @export
 */
export function printHello () {
  printLogo()
  console.log(`
              0  100      00110       
              0    0000 0   1        
                0 1   11   10        
                01       0          
                1 1111110           
                01 111110           
                0000011100          
                1100 111100         
                  1110011100         
                01111000010          
                0  111110           
                  0  111110          
                01 10111110         
                1  110111111         
              0   10001111101  10
  `)
}

/**
 * Determine if it is a git repository
 *
 * @export
 * @param {string} path
 * @returns
 */
export async function isGitRepo (path: string): Promise<any> {
  const execPath = resolve('.')
  const gitExecPath = `${os.tmpdir()}/.sagacious/GitExecPath`
  await fs.mkdirp(gitExecPath)
  process.chdir(gitExecPath)
  await execa('git', ['init'])
  return execa('git', ['remote', 'show', path])
    .then(() => true)
    .catch(() => false)
    .finally(() => process.chdir(execPath))
}

/**
 * Determine if it is a folder
 *
 * @export
 * @param {string} path
 * @returns
 */
export function isDir (path: string): Promise<any> {
  return fs.readdir(path)
    .then(() => true)
    .catch(() => false)
}

/**
 * Determine if it is an npm package
 *
 * @export
 * @param {string} name
 * @returns
 */
export function isNpm (name: string): Promise<any> {
  return execa('npm', ['view', name])
    .then(() => true)
    .catch(() => false)
}

/**
 * promise quene
 *
 * @export
 * @template T
 * @param {Array<() => Promise<any>>} ps
 * @returns
 */
export async function PromiseQuene<T> (ps: Array<() => Promise<any>>) {
  const res: T[] = []
  let i = 0
  while (i < ps.length) {
    res.push(await ps[i]())
    i++
  }
  return res
}

/**
 * race with some rules
 *
 * @export
 * @template T
 * @param {Promise<T>[]} ps
 * @param {(t: T, ...args: any[]) => boolean} regFn
 * @param {...any[]} args
 * @returns
 */
export function PromiseRaceBy<T> (ps: Promise<T>[], regFn: (t: T, ...args: any[]) => boolean, ...args: any[]) {
  return new Promise<{
    data?: any
    p?: Promise<T>
    i: number
  }>(r => {
    let e = 0
    ps.forEach((p, i) => {
      p.then(data => {
        if (regFn(data, ...args)) r({
          data,
          p,
          i,
        })
      })
        .finally(() => {
          if (++e === ps.length) r({
            i: -1,
          })
        })
    })
  })
}
