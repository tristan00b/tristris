import 'babel-polyfill'
import './app.sass'
import config from './src/config.js'
import Game from './src/game.js'

// enable hot reloading during development
if (config.debug) require('./index.html')

// display version
document.getElementById('app-version').innerHTML = config.appVersion;

new Game().start()
