import dayjs from 'dayjs'
import {
  red,
} from 'chalk'

export function log (message: string) {
  console.log(`[${red(dayjs()
    .format('HH:mm:ss'))}] - ${message}`)
}
