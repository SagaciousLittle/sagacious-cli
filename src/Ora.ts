import ora from 'ora'

export default function (text: string) {
  return ora({
    text,
    spinner: {
      interval: 80,
      frames: [
        '⠋',
        '⠙',
        '⠹',
        '⠸',
        '⠼',
        '⠴',
        '⠦',
        '⠧',
        '⠇',
        '⠏',
      ],
    },
  })
}
