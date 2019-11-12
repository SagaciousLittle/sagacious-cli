const { eslint } = require('rollup-plugin-eslint')
const json = require('rollup-plugin-json')
const ts = require('rollup-plugin-typescript2')
const bin = require('rollup-plugin-bin')
const del = require('rollup-plugin-delete')

module.exports = {
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
    eslint({
      fix: true,
    }),
    ts(),
    bin(),
  ],
}
