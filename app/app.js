import 'babel-polyfill'
import './app.sass'
import Tetris from './src/tetris.js'
import config from './assets/data/config.json'

if (process.env.NODE_ENV !== 'production') {
  // enable hot reloading during development
  require('./index.html')
}

const canvas = {
  'main': document.getElementsByClassName('main-canvas')[0],
  'next':   document.getElementsByClassName('next-canvas')[0],
  'held':   document.getElementsByClassName('held-canvas')[0],
}
new Tetris(canvas, config).loop()
