const {nodeResolve} = require('@rollup/plugin-node-resolve')
const typescript = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const nodePolyfills = require('rollup-plugin-polyfill-node')

const outdir = (fmt, env) => (env === 'node' ? 'node' : fmt)

function onwarn(warning) {
  // suppress warning about circular dependencies in external dependencies
  // to reduce noise in the console
  if (
    warning?.code === 'CIRCULAR_DEPENDENCY' &&
    warning?.ids?.some(
      (id) =>
        id.includes('node_modules/readable-stream') ||
        id.includes('node_modules/@wingriders/cab') ||
        id.includes('polyfill-node._stream') ||
        id.includes('chai')
    )
  ) {
    return
  }

  // eslint-disable-next-line no-console
  console.warn(`(!) ${warning?.message}`)
}

const rolls = (fmt, env) => ({
  input: 'src/index.ts',
  onwarn,
  output: {
    dir: `dist`,
    format: fmt,
    entryFileNames: `${outdir(fmt, env)}/[name].${fmt === 'cjs' ? 'cjs' : 'js'}`,
    name: '@wingriders/governance-sdk',
  },
  plugins: [
    nodeResolve({browser: env === 'browser', preferBuiltins: env === 'node'}),
    commonjs(),
    json(),
    ...(env === 'browser' ? [nodePolyfills()] : []),
    typescript({
      target: fmt === 'es' ? 'ES2022' : 'ES2017',
      outDir: `dist/${outdir(fmt, env)}`,
      rootDir: 'src',
    }),
  ],
})

module.exports = [
  rolls('umd', 'browser'),
  rolls('es', 'browser'),
  rolls('cjs', 'browser'),
  rolls('cjs', 'node'),
]
