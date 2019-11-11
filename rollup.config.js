const { eslint } = require('rollup-plugin-eslint')
const json = require('rollup-plugin-json')
const ts = require('rollup-plugin-typescript2')

module.exports = {
  input: './src/index.ts',
  output: {
    file: './bin/sag.js',
    format: 'cjs',
  },
  plugins: [
    json(),
    eslint({
      fix: true,
    }),
    ts(),
  ],
}
