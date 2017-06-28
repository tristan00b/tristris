/*
  tetris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tetrist clone...
           The Tetris class defined hear contains the game logic for contorlling
           and manipulating the player's piece and board.
  Created: June 23, 2017
  License: GPLv3
*/

const canvas = document.getElementsByClassName('tetris')[0]

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

const tileScale = 36

const timeStep = 1000 // 1 second

function zeroMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(0))
}

function identityMatrix(width, height) {
  return Array(height || width).fill().map(() => Array(width).fill(1))
}

function drawTile(context, x, y, colour) {
  [x, y] = [x*tileScale, y*tileScale]
  context.fillStyle = colour
  context.fillRect(x, y, tileScale, tileScale)
  context.strokeStyle = 'white'
  context.lineWidth = 1
  context.strokeRect(x, y, tileScale, tileScale)
}

class Tetris extends EventDispatcher {

  constructor(canvas) {

    super()

    this.canvas = canvas
    this.canvas.width = tileScale * 10;
    this.canvas.height = tileScale * 20;
    this.context = canvas.getContext('2d')
    this.arena = new Arena(this)
    this.player = new Player(this)
    this.audio = new SoundPlayer(this)
    this.score = 0
    this.highscore = 0

    document.addEventListener('keydown', (event) => {
      switch (event.keyCode) {
        case 38:
          this.rotatePlayer()
          break
        case 37:
          this.movePlayer(-1)
          break
        case 39:
          this.movePlayer(1)
          break
        case 40:
          this.lowerPlayer()
          break
        case 77:
          this.toggleMusic()
          break
      }
    })

    this.prevTime = 0
    this.accumulatedTime = 0
    this.update()
  }

  update(time = 0) {
    let dt = time - this.prevTime
    this.prevTime = time
    this.accumulatedTime += dt;

    if (this.accumulatedTime >= timeStep) {
      this.lowerPlayer()
    }

    this.draw()
    requestAnimationFrame((time) => {
      this.update(time)
    });
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  draw() {
    this.clearCanvas()
    this.player.draw()
    this.arena.draw()
  }

  lowerPlayer() {

    let player = this.player
    let arena = this.arena

    // Reset Accumulator every time the piece is dropped
    this.accumulatedTime = 0

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

    this.dispatch({type: 'tetris/playerRotated'});
  }

  resetPlayer() {
    this.player.reset()
  }

  restartGame() {
    this.setScore(0)
    this.arena.reset()
  }

  updateScore(linesCleared) {
    if (linesCleared == 0) return;
    let points = this.score + (linesCleared ? 10**linesCleared : 0)
    this.setScore(points)
    this.dispatch({
      type: 'tetris/linesCleared', linesCleared: linesCleared
    });
  }

  setScore(points) {
    this.score = points
    document.getElementById('score').innerHTML =
      `You have ${this.score} points` + (this.score > 100000 ? '!' : '.');
  }

  updateHighscore() {
    if (this.score > this.highscore) {
      this.setHighscore(this.score)
    }
  }

  setHighscore(points) {
    this.highscore = points
    document.getElementById('highscore').innerHTML =
      `Highscore ${this.highscore} points.`;
  }

  toggleMusic() {
    this.dispatch({type: 'tetris/toggleMusic'})
  }
}

let tetris = new Tetris(canvas) // object creation starts game
