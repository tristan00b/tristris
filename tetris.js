/*
  tetris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tetrist clone...
           The Tetris class defined hear contains the game logic for contorlling
           and manipulating the player's piece and board.
  Created: June 23, 2017
  License: GPLv3
*/

class Tetris extends EventObserver {

  constructor(canvas, config) {

    super()

    this.config = config
    this.time = {
      accumulated: 0,
      prev: 0,
      step: 1000,
    }
    this.paused = false

    this.canvas = canvas
    const {gridSize, tileScale} = config.graphics
    this.canvas.width = gridSize.width * tileScale
    this.canvas.height = gridSize.height * tileScale
    this.context = canvas.getContext('2d')

    this.eventHandlers = {
      'tetris/player/rotate': () => this.rotatePlayer(),
      'tetris/player/moveLeft': () => this.movePlayer(-1),
      'tetris/player/moveRight': () => this.movePlayer(1),
      'tetris/player/moveDown': () => this.lowerPlayer(),
      'tetris/game/togglePause': () => this.togglePause(),
    }

    this.eventDispatcher = new EventDispatcher()
    this.eventDispatcher.subscribeAll(this.eventHandlers, this)

    this.input = new Input(this)
    this.graphics = new Graphics(this)
    this.audio = new SoundPlayer(this)
    this.arena = new Arena(this)
    this.player = new Player(this)

    this.eventDispatcher.dispatch(new Event('tetris/game/started'))
  }

  update(dt = 0) {
    let time = this.time
    time.accumulated += dt;
    if (time.accumulated >= time.step) {
      time.accumulated = 0
      this.lowerPlayer()
    }
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.player.draw()
    this.arena.draw()
  }

  loop(time = 0) {
    this.update(time - this.time.prev)
    this.draw()
    this.time.prev = time

    this.time.animationFrameId =
      requestAnimationFrame(time => this.loop(time))
  }

  lowerPlayer() {

    let player = this.player
    let arena = this.arena

    // Reset Accumulator every time the piece is dropped
    this.time.accumulated = 0

    player.translate({x: 0, y: 1})

    if (arena.checkForCollision(player)) {

      player.translate({x: 0, y: -1})

      if (arena.overflows(player)) {
        this.updateHighscore()
        this.restartGame()
      } else {
        arena.merge(player)
      }

      const rowsCleared = arena.sweep()
      this.player.updateScore(rowsCleared)
      this.player.reset()
      this.updateScore();
      this.eventDispatcher.dispatch(
        new Event('tetris/arena/rowsCleared', {rowsCleared: rowsCleared})
      )
    }
  }

  movePlayer(dx) {
    this.player.translate({x: dx, y:0})
    if (this.arena.checkForCollision(this.player)) {
      this.player.translate({x: -dx, y:0})
    }
  }

  rotatePlayer() {

    let player = this.player
    let arena = this.arena

    let orig = player.piece
    player.rotate()

    // A rotation next to a wall can result in collision. When this happens,
    // we'll translate left or right to move the piece out of the way. As we do
    // not know my how much the piece extends pass the wall, we move the piece
    // then retest for collision one step at at time. The number of required
    // checks is bounded by the size of the piece.

    for(let i=0; i < player.size; ++i) {
      let dir = arena.checkForCollision(player)

      // LHS collision
      if (dir === -1) {
        player.translate({x:1, y:0})
      }

      /// RHS collision
      else if (dir === 1) {
        player.translate({x:-1, y:0})
      }

      /// Bottom collision
      else if (dir === true) {
        // player.translate({x:0, y:-1})
        player.piece = orig
      }
    }

    this.eventDispatcher.dispatch(new Event('tetris/player/rotated'))
  }

  resetPlayer() {
    this.player.reset()
  }

  restartGame() {
    this.player.score = 0
    this.arena.reset()
  }

  updateScore() {
    document.getElementById('score').innerHTML =
      `You have ${this.player.score} points` +
        (this.player.score > 100000 ? '!' : '.')
  }

  updateHighscore() {
    document.getElementById('highscore').innerHTML =
      `Highscore ${this.player.highscore} points.`
  }

  togglePause() {
    this.paused = !this.paused
    this.paused ? this.pauseGame() : this.unpauseGame()
  }

  pauseGame() {
    cancelAnimationFrame(this.time.animationFrameId)
    this.eventDispatcher.dispatch(new Event('tetris/game/paused'))
  }

  unpauseGame() {
    this.loop(this.time.prev)
    this.eventDispatcher.dispatch(new Event('tetris/game/unpaused'))
  }
}
