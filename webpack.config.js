process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path'),
  fs = require('fs'),
  webpack = require('webpack'),
  merge = require('webpack-merge')
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  nodeLoader = require('node-loader');

const { NODE_ENV } = process.env;
let nodeModules = {};

fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1 &&
      (x === 'java' || x === 'robotjs')
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = (env, options) => {
  let dev = {
    entry: {
      main: path.join(__dirname, 'src/electron-main/main.ts'),
      app: path.join(__dirname, 'src/app/main.tsx')
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].bundle.js'
    },
    target: 'electron-main',
    node: {
      __dirname: false,
      console: true,
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
    devtool: 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        options: {
          transpileOnly: false
        }
      }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /.woff$|.woff2$|.ttf$|.eot$|.svg$|.jpg$/,
        loader: 'url-loader'
      }, {
        test: /\.node$/,
        use: 'node-loader'
      }]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('development')
        }
      }),
    ],
    externals: nodeModules
  };

  let prod = {
    plugins: [
      new UglifyJsPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        compress: {
          warnings: false,
          drop_console: false
        }
      })
    ]
  };
  if (options.mode === 'production') {
    delete dev['plugins'];
    return merge(dev, prod);
  }
  else return dev;
};

