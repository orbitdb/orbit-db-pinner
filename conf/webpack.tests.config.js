import glob from 'glob'
import path from 'path'
import webpack from 'webpack'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

export default (env, argv) => {
  const require = createRequire(import.meta.url)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  return {
    entry: glob.sync('./test/browser/**/*.js'),
    output: {
      filename: '../test/browser/bundle.js'
    },
    target: 'web',
    mode: 'development',
    devtool: 'source-map',
    externals: {
      fs: '{ existsSync: () => true }',
      'fs-extra': '{ copy: () => {} }',
      rimraf: '{ rimraf: () => {} }'
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer']
      }),
      new webpack.DefinePlugin({
        'process.env.ORBITER_ID': JSON.stringify(process.env.ORBITER_ID),
        'process.env.ORBITER_ADDRESS': JSON.stringify(process.env.ORBITER_ADDRESS)
      })
    ],
    resolve: {
      modules: [
        'node_modules',
        path.resolve(__dirname, '../node_modules')
      ],
      fallback: {
        path: require.resolve('path-browserify'),
        crypto: false,
        stream: require.resolve('stream-browserify'),
        os: require.resolve('os-browserify')
      }
    },
    resolveLoader: {
      modules: [
        'node_modules',
        path.resolve(__dirname, '../node_modules')
      ],
      extensions: ['.js', '.json'],
      mainFields: ['loader', 'main']
    }
  }
}
