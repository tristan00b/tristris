import 'babel-polyfill'
import './app.sass'
import Tristris from './src/tristris.js'
import config from './assets/data/config.json'

config.debug = process.env.NODE_ENV !== 'production'

// enable hot reloading during development
if (config.debug) require('./index.html')

// display version
document.getElementById('app-version').innerHTML = process.env.VERSION;

const canvas = {
  'main': document.getElementsByClassName('main-canvas')[0],
  'next':   document.getElementsByClassName('next-canvas')[0],
  'held':   document.getElementsByClassName('held-canvas')[0],
}
new Tristris(canvas, config).start()
