import dayjs from 'dayjs'
import figlet from 'figlet'
import {
  gray,
  cyanBright,
} from 'chalk'

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
