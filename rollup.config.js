import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

// @carbon/icons-react 依赖了 prop-types
const external = Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies), [
  'rxjs/operators',
  'prop-types',
])

const config = (arg) => ({
  plugins: [
    resolve({
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.node'],
    }),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  external,
  treeshake: {
    moduleSideEffects: false,
  },
  ...arg,
})

const input = {
  'srp-table': 'src/srp-table.ts',
  'srp-table-pivot': 'src/srp-table-pivot.ts',
}

export default [
  config({
    input: input,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].esm.js',
      chunkFileNames: 'chunks/srp-table-[name]-[hash].esm.js',
    },
  }),
  config({
    input: input,
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/srp-table-[name]-[hash].js',
    },
  }),
]
