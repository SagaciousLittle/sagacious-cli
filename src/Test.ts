const fs = require('fs')
const os = require('os')
const del = require('del')
const {
  spawn,
} = require('child_process')

// cp.spawn('yarn', ['add', 'dayjs'], {
//   stdio: 'inherit',
// })

const bat = spawn('yarn.cmd', ['add', 'dayjs'], {
  stadio: 'inherit'
})