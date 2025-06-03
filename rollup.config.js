const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.esm.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      outDir: 'dist/esm'
    })
  ],
  external: [
    'fs',
    'path',
    'os',
    'crypto',
    'util',
    'events',
    'stream',
    'child_process',
    'commander',
    'chalk',
    'figlet',
    'gradient-string',
    'fs-extra',
    'axios',
    'openai',
    'inquirer',
    'ora',
    'boxen',
    'cli-table3',
    'nanospinner',
    'semver',
    'dotenv',
    'zod'
  ]
}; 