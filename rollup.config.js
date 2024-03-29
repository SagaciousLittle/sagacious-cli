const { eslint } = require('rollup-plugin-eslint')
const json = require('rollup-plugin-json')
const ts = require('@rollup/plugin-typescript')
const bin = require('rollup-plugin-bin')
const del = require('rollup-plugin-delete')
const fs = require('@sagacious/fs-wrapper')
const path = require('path')

const libOptions = fs.readDirProSync(path.resolve(__dirname, './src'), {
  deep: true,
  withFileTypes: true,
})
  .filter(f => /\.ts$/.test(f.absolutePath))
  .map(f => ({
    input: f.absolutePath,
    output: {
      file: `./lib/${f.name.replace(/\.ts$/, '')}.js`,
      format: 'cjs',
    },
    plugins: [
      json(),
      eslint({
        fix: true,
      }),
      ts({
        module: 'CommonJS',
      }),
    ],
  }))

module.exports = [
  {
    input: './src/index.ts',
    output: {
      file: './bin/sag',
      format: 'cjs',
    },
    plugins: [
      del({
        targets: 'bin/*',
      }),
      json(),
      ts({
        declaration: false,
      }),
      bin(),
    ],
    onwarn (info, warn) {
      if (info.code === 'UNRESOLVED_IMPORT') return
      warn(info)
    },
  },
  ...libOptions,
]
