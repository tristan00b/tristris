/*
  player.js

  Author:  J. Tristan Bayfield
  Desc:    Defines the Player class, which represents the current tile and it's
           position, on the board as well as provides methods for translation
           and rotation.
  Created: June 23, 2017
  License: GPLv3
*/

class Player {

  constructor(game) {
    this.canvas = game.canvas
    this.context = game.context
    this.config = game.config.graphics
    this.graphics = game.graphics
    this.eventDispatcher = game.eventDispatcher

    this.next = this.chooseNewPiece()
    this.held = {
      shape: '',
      array: [],
      pos: {x: 0, y: 0}
    }

    this.score = 0
    this.highscore = 0

    this.reset()
  }

  draw() {
    this.graphics.drawTiles(this.context.main, this.curr.array, this.curr.pos)
    this.graphics.drawTiles(this.context.next, this.next.array, this.next.pos)
    this.graphics.drawTiles(this.context.held, this.held.array, this.held.pos)
  }

  translate(amt) {
    this.curr.pos.y += amt.y
    this.curr.pos.x += amt.x
  }

  rotate() {
    let orig = this.curr.array
    let rotated = zeroMatrix(this.curr.array.length)

    orig.forEach((row, x) => {
      row.forEach((row, y) => {
        rotated[y][x] = orig[x][y]
      })
    })
    rotated.forEach(row => row.reverse())
    this.curr.array = rotated

    this.eventDispatcher.dispatch(new Event('tetris/player/rotated'))
  }

  hold() {

    let temp = this.held
    this.held = this.newPiece(this.curr.shape)

    if (temp.shape)
    {
      this.curr = temp
      this.curr.pos = {
        x: (this.config.grid.main.size.w - this.curr.array.length)/2|0,
        y: -this.curr.array.length
      }
    }
    else
    {
      this.reset()
    }

    this.next.pos = this.centerPosition(this.next, this.canvas.next)
    this.held.pos = this.centerPosition(this.held, this.canvas.held)
  }

  newPiece(shape) {
    return Object.assign(
      {shape: shape, pos: {x: 0, y: 0}},
      deepCopy(this.config.tetrominos.shapes[shape])
    )
  }

  chooseNewPiece() {
    const freq = this.config.tetrominos.frequencies
    const shape = freq[Math.random() * freq.length | 0]
    return this.newPiece(shape)
  }

  centerPosition(piece, canvas) {
    return {
      x: canvas.width/(this.config.tileScale*2) - piece.center.x,
      y: canvas.height/(this.config.tileScale*2) - piece.center.y
    }
  }



  reset() {
    this.curr = this.next
    this.next = this.chooseNewPiece()

    this.curr.pos = {
      x: (this.config.grid.main.size.w - this.curr.array.length)/2|0,
      y: -this.curr.array.length
    }

    this.next.pos = this.centerPosition(this.next, this.canvas.next)
  }

  updateScore(rowsCleared) {
    if (rowsCleared == 0) return
    this.score = this.score + (rowsCleared ? 10**rowsCleared : 0)
    this.highscore = this.score > this.highscore ? this.score : this.highscore
  }

}
