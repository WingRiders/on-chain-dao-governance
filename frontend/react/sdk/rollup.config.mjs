import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: [
    // ES Module
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    // CommonJS format
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  external: [
    // Exclude React from the bundle, it's a peer dependency
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ],
  plugins: [
    resolve({browser: true, preferBuiltins: false}), // Resolves node modules
    commonjs(),
    typescript(),
    terser(), // Minify the bundle
  ],
}
