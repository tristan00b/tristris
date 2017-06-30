/*
  tetris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tetrist clone...
           The Tetris class defined hear contains the game logic for contorlling
           and manipulating the player's piece and board.
  Created: June 23, 2017
  License: GPLv3
*/

const tetrominos = {
  'I': [[0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]],

  'O': [[2, 2],
        [2, 2]],

  'T': [[0, 0, 0],
        [3, 3, 3],
        [0, 3, 0]],

  'J': [[0, 4, 0],
        [0, 4, 0],
        [4, 4, 0]],

  'L': [[0, 5, 0],
        [0, 5, 0],
        [0, 5, 5]],

  'S': [[0, 0, 0],
        [0, 6, 6],
        [6, 6, 0]],

  'Z': [[0, 0, 0],
        [7, 7, 0],
        [0, 7, 7]],
}

const pieces = 'IIOTJLSZ'

const pieceColours = [
  '#00A4E2',
  '#FFC749',
  '#A44A9E',
  '#FF7D3D',
  '#3F4BC3',
  '#EE202C',
  '#18B05B',
]

function drawTile(context, x, y, scale, colour) {
  [x, y] = [x*scale, y*scale]
  context.fillStyle = colour
  context.fillRect(x, y, scale, scale)
  context.strokeStyle = 'white'
  context.lineWidth = 1
  context.strokeRect(x, y, scale, scale)
}

class Tetris extends EventObserver {

  constructor(data) {

    super()

    this.data = data
    this.data.time.step = 1000
    this.data.canvas.width  = this.data.gridSize.width * this.data.tileScale
    this.data.canvas.height = this.data.gridSize.height * this.data.tileScale

    this.arena = new Arena(data)
    this.player = new Player(data)
    this.audio = new SoundPlayer(data)

    document.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      else if (event.keyCode === 38)
        this.data.eventDispatcher.dispatch(new Event('tetris/player/rotate'));
      else if (event.keyCode === 37)
        this.data.eventDispatcher.dispatch(new Event('tetris/player/moveLeft'));
      else if (event.keyCode === 39)
        this.data.eventDispatcher.dispatch(new Event('tetris/player/moveRight'));
      else if (event.keyCode === 40)
        this.data.eventDispatcher.dispatch(new Event('tetris/player/moveDown'));
      else if (event.keyCode === 77)
        this.data.eventDispatcher.dispatch(new Event('tetris/sound/toggleMusic'));
      else if (event.keyCode === 80)
        this.data.eventDispatcher.dispatch(new Event('tetris/game/togglePause'));
    })

    this.eventHandlers = {
      'tetris/player/rotate': () => this.rotatePlayer(),
      'tetris/player/moveLeft': () => this.movePlayer(-1),
      'tetris/player/moveRight': () => this.movePlayer(1),
      'tetris/player/moveDown': () => this.lowerPlayer(),
      'tetris/game/togglePause': () => this.togglePause(),
    }

    data.eventDispatcher.subscribeAll(this.eventHandlers, this)

    data.eventDispatcher.dispatch(new Event('tetris/game/started'))
  }

  update(dt = 0) {
    let time = this.data.time
    time.accumulated += dt;
    if (time.accumulated >= time.step) {
      time.accumulated = 0
      this.lowerPlayer()
    }
  }

  draw() {
    const {canvas, context} = this.data
    context.clearRect(0, 0, canvas.width, canvas.height)
    this.player.draw()
    this.arena.draw()
  }

  loop(time = 0) {
    this.update(time - this.data.time.prev)
    this.draw()
    this.data.time.prev = time

    this.data.animationFrameId =
      requestAnimationFrame(time => this.loop(time))
  }

  lowerPlayer() {

    let player = this.player
    let arena = this.arena

    // Reset Accumulator every time the piece is dropped
    this.data.time.accumulated = 0

    player.translate({x: 0, y: 1})

    if (arena.checkForCollision(player)) {

      player.translate({x: 0, y: -1})

      if (arena.overflows(player)) {
        this.updateHighscore()
        this.restartGame()
      } else {
        arena.merge(player)
      }

      this.updateScore(arena.sweep())
      this.resetPlayer()
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
        player.translate({x:0, y:-1})
      }
    }

    this.data.eventDispatcher.dispatch(new Event('tetris/player/rotated'))
  }

  resetPlayer() {
    this.player.reset()
  }

  restartGame() {
    this.setScore(0)
    this.arena.reset()
  }

  updateScore(rowsCleared) {
    if (rowsCleared == 0) return;
    let points = this.data.score + (rowsCleared ? 10**rowsCleared : 0)
    this.setScore(points)
    this.data.eventDispatcher.dispatch(
      new Event('tetris/arena/rowsCleared', {rowsCleared: rowsCleared})
    )
  }

  setScore(points) {
    this.data.score = points
    document.getElementById('score').innerHTML =
      `You have ${this.data.score} points` +
        (this.data.score > 100000 ? '!' : '.')
  }

  updateHighscore() {
    if (this.data.score > this.data.highscore) {
      this.setHighscore(this.data.score)
    }
  }

  setHighscore(points) {
    this.data.highscore = points
    document.getElementById('highscore').innerHTML =
      `Highscore ${this.data.highscore} points.`
  }

  togglePause() {
    this.data.paused = !this.data.paused
    this.data.paused ? this.pauseGame() : this.unpauseGame()
  }

  pauseGame() {
    cancelAnimationFrame(this.data.animationFrameId)
    this.data.eventDispatcher.dispatch(new Event('tetris/game/paused'))
  }

  unpauseGame() {
    this.loop(this.data.time.prev)
    this.data.eventDispatcher.dispatch(new Event('tetris/game/unpaused'))
  }
}
