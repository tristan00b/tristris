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
    this.config = game.config
    this.graphics = game.graphics
    this.reset()
  }

  draw() {
    this.graphics.drawTiles(this.piece, this.pos)
  }

  translate(amt) {
    this.pos.y += amt.y
    this.pos.x += amt.x
  }

  rotate() {
    let orig = this.piece
    let rotated = zeroMatrix(this.size)

    orig.forEach((row, x) => {
      row.forEach((row, y) => {
        rotated[y][x] = orig[x][y]
      })
    })
    rotated.forEach(row => row.reverse())

    this.piece = rotated
  }

  chooseNewPiece() {
    const tetrominos = this.config.graphics.tetrominos.shapes
    const pieces = this.config.graphics.tetrominos.frequencies
    let l = pieces[Math.random()*pieces.length | 0]
    this.piece = tetrominos[l]
    this.size = this.piece.length
  }

  reset() {
    this.chooseNewPiece()
    // Start centered and offscreen
    this.pos = {
      x: (this.config.graphics.gridSize.width - this.size)/2|0,
      y: -this.size
    }
  }
}
