import dayjs from 'dayjs'
import figlet from 'figlet'
import {
  gray,
  cyanBright,
} from 'chalk'
import execa, {
  ExecaReturnValue, 
} from 'execa'
import fs from 'fs-extra'

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
  console.log(cyanBright(figlet.textSync(LOGO)))
}

/**
 * Determine if it is a git repository
 *
 * @export
 * @param {string} path
 * @returns
 */
export function isGitRepo (path: string): Promise<any> {
  try {
    return execa('git', ['remote', 'show', path])
  } catch (e) {
    return Promise.resolve(false)
  }
}

/**
 * Determine if it is a folder
 *
 * @export
 * @param {string} path
 * @returns
 */
export function isDir (path: string): Promise<any> {
  try {
    return fs.readdir(path)
  } catch (e) {
    return Promise.resolve(false)
  }
}

/**
 * Determine if it is an npm package
 *
 * @export
 * @param {string} name
 * @returns
 */
export function isNpm (name: string): Promise<any> {
  try {
    return execa('npm', ['view', name])
  } catch (e) {
    return Promise.resolve(false)
  }
}

export async function PromiseQuene<T> (ps: Array<() => Promise<any>>) {
  const res: T[] = []
  let i = 0
  while (i < ps.length) {
    res.push(await ps[i]())
    i++
  }
  return res
}
