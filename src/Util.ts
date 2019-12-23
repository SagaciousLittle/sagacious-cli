import dayjs from 'dayjs'
import figlet from 'figlet'
import {
  gray,
  cyanBright,
} from 'chalk'
import execa from 'execa'
import fs from 'fs'

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
export function isGitRepo (path: string) {
  try {
    return execa.sync('git', ['remote', 'show', path]).exitCode === 0
  } catch (e) {
    return false
  }
}

/**
 * Determine if it is a folder
 *
 * @export
 * @param {string} path
 * @returns
 */
export function isDir (path: string) {
  try {
    fs.readdirSync(path)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Determine if it is an npm package
 *
 * @export
 * @param {string} name
 * @returns
 */
export function isNpm (name: string) {
  try {
    execa.sync('npm', ['view', name])
    return true
  } catch (e) {
    return false
  }
}

export async function PromiseQuene (ps: Array<() => Promise<any>>) {
  let i = 0
  while (i < ps.length) {
    await ps[i]()
    i++
  }
}
