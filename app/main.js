import config from './assets/data/config.json'
import Game   from './src/game.js'

window.addEventListener('load', async _ => {
  new Game(config).start()
})
