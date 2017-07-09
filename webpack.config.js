const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');

const gitRevisionPlugin = new GitRevisionPlugin({
  versionCommand: 'describe --tags',
  commithashCommand: 'rev-list --max-count=1 --abbrev-commit HEAD'
});

const buildingForProduction =
  !!(process.env.NODE_ENV && process.env.NODE_ENV === 'production');

const cssConfig = buildingForProduction
  ? ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: ['css-loader', 'sass-loader'],
      publicPath: '/dist'
    })
  : ['style-loader', 'css-loader', 'sass-loader'];

module.exports = {
  context: path.join(__dirname, 'app'),
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    hot: true,
    inline: true
  },
  entry: {
    app: ['babel-polyfill', './app.js']
  },
  output: {
    filename: '[name].bundle.[hash].js',
    path: path.resolve(__dirname, 'dist'),
    pathinfo: !buildingForProduction
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "raw-loader"
      },
      {
        test: /\.sass$/,
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
        test: /\.ttf$/,
        use: 'url-loader'
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin(
      [ { from: 'assets', to: 'assets' } ],
      { copyUnmodified: true, ignore: ['*.tff', '*.zip', '.DS_Store'] }
    ),
    new HtmlWebpackPlugin({
      title: 'TrisTris',
      template: './index.html',
      filename: 'index.html',
      minify: {
        collapseWhitespace: buildingForProduction,
        removeComments: buildingForProduction,
      },
      hash: true,
    }),
    new ExtractTextPlugin({
      filename: 'app.css',
      disable: !buildingForProduction,
      allChunks: true
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
    	'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.VERSION': JSON.stringify(gitRevisionPlugin.version()),
      'process.env.COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
    }),
  ],
  stats: 'errors-only'
};
