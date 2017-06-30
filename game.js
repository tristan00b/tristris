/*
  game.js

  Author:  J. Tristan Bayfield
  Desc:    An attempt at making a generic game wrapper. Not sure there is any
           point to it...
  Created: June 29, 2017
  License: GPLv3
*/

class Game {

  constructor(game, config) {

    const canvas = document.getElementsByClassName('tetris')[0]

    this.data = Object.assign(
      config,
      {
        canvas: canvas,
        context: canvas.getContext('2d'),
        eventDispatcher: new EventDispatcher(),
        time: {
          accumulated: 0,
          prev: 0,
          step: 1/60,
        },
        score: 0,
        highscore: 0,
        paused: false,
        bgMusicMuted: false,
      }
    )
    this.game = new game(this.data)
  }

  run() {
    this.game.loop()
  }

}

(new Game(Tetris, {
  tileScale: 36,
  gridSize: {width: 10, height: 20},
  sound: {
    sfxPath: 'assets/audio/effects',
    musPath: 'assets/audio/soundtrack',
    numTracks: 13,
  }
})).run()
