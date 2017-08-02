import 'babel-polyfill'
import './app.sass'
import Tristris from './src/tristris.js'
import config from './src/config.js'

// enable hot reloading during development
if (config.debug) require('./index.html')

// display version
document.getElementById('app-version').innerHTML = config.appVersion;

const canvas = {
  'main': document.getElementsByClassName('main-canvas')[0],
  'next': document.getElementsByClassName('next-canvas')[0],
  'held': document.getElementsByClassName('held-canvas')[0],
}
new Tristris(canvas).start()
