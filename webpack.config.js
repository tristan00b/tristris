const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = (env) => {

  let buildingForProduction = env && env.production;
  let cssConfig = buildingForProduction
    ? ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'sass-loader'],
        publicPath: '/dist'
      })
    : ['style-loader', 'css-loader', 'sass-loader'];

  return {
    context: path.join(__dirname, 'app'),
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      hot: true,
      inline: true,
    },
    entry: {
      app: ['babel-polyfill', './app.js']
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      pathinfo: true
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: cssConfig
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.json$/,
          use: 'json-loader'
        },
        {
          test: /\.tff$/,
          use: 'url-loader'
        },
      ]
    },
    plugins: [
      new CopyWebpackPlugin(
        [ { from: 'assets', to: 'assets' } ],
        { copyUnmodified: false, ignore: ['*.zip', '*.tff'] }
      ),
      new HtmlWebpackPlugin({
        title: 'TrisTris',
        template: 'index.ejs',
        filename: 'index.html',
        minify: { collapseWhitespace: buildingForProduction },
        hash: true,
      }),
      new ExtractTextPlugin({
        filename: 'app.css',
        disable: !buildingForProduction,
        allChunks: true
      }),
      new webpack.HotModuleReplacementPlugin(),
    ]
  };
};
