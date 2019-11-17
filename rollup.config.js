import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const baseConfig = {
  input: 'src/index.js',
  external: ['react', 'react-dom', 'prop-types'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ],
  plugins: [
    babel({
      presets: [['@babel/preset-env', { loose: true }], '@babel/preset-react'],
      babelrc: false,
      exclude: 'node_modules/**'
    }),
    resolve(),
    commonjs()
  ]
};

const browserConfig = {
  ...baseConfig,
  output: [
    { file: pkg.browser[pkg.main], format: 'cjs' },
    { file: pkg.browser[pkg.module], format: 'es' }
  ],
  plugins: [
    replace({
      'process.browser': JSON.stringify(true)
    }),
    ...baseConfig.plugins
  ]
};

const configs = [
  baseConfig,
  browserConfig,
  {
    ...browserConfig,
    output: [
      {
        file: pkg.browser[pkg.main].replace(/\.js$/, '.min.js'),
        format: 'cjs'
      }
    ],
    plugins: [...browserConfig.plugins, terser({ toplevel: true })]
  },
  // FIXME: Due to a bug in rollup-plugin-terser, multiple outputs need to be
  // split into separate configurations.
  {
    ...browserConfig,
    output: [
      {
        file: pkg.browser[pkg.module].replace(/\.js$/, '.min.js'),
        format: 'es'
      }
    ],
    plugins: [...browserConfig.plugins, terser({ toplevel: true })]
  }
];

export default configs;
