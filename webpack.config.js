const path = require('path'),
		  fs = require('fs'),
		  webpack = require('webpack'),
			merge = require('webpack-merge'),
			BabiliPlugin = require("babili-webpack-plugin");

const { NODE_ENV } = process.env;
let nodeModules = {};

fs.readdirSync('node_modules')
	.filter(function(x) {
		return ['.bin'].indexOf(x) === -1 && x === 'java';
	})
	.forEach(function(mod) {
		nodeModules[mod] = 'commonjs ' + mod;
	});

let dev = {
	entry: {
		main: path.join(__dirname, 'src/electron-main/main.ts'),
		app: path.join(__dirname, 'src/app/main.tsx')
	},
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].bundle.js'
	},
	target: 'electron',
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
			loader: "ts-loader",
			options: {
				transpileOnly: false
			}
		}, {
			test: /\.css$/,
			use: ['style-loader', 'css-loader']
		}, {
			test: /.woff$|.woff2$|.ttf$|.eot$|.svg$/,
			loader: 'url-loader'
		}]
	},
	externals: nodeModules,
};

let prod = {
	plugins: [
		new BabiliPlugin(),
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("production")
			}
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
			compress: {
				warnings: false,
				drop_console: false,
			}
		})
	]
};

if(NODE_ENV === 'production') {
	delete dev.devtool;
	module.exports = merge(dev, prod);
} else module.exports = dev;
