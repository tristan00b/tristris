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

  constructor(tetris) {
    this.tetris = tetris
    this.pos = {x: 0, y: 0}
    this.piece = null
  }

  draw() {
    this.piece.forEach((row, yOffset) => {
      row.forEach((value, xOffset) => {
        if (value) {
          this.tetris.drawTile(
            this.pos.x + xOffset,
            this.pos.y + yOffset,
            pieceColours[value-1])
        }
      })
    })
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
    rotated.forEach((row) => { row.reverse() })

    this.piece = rotated
  }

  reset(pos) {
    let l = pieces[Math.random()*pieces.length | 0]
    this.piece = tetrominos[l]
    this.size = this.piece.length
    this.pos = pos
    this.pos.y -= this.size // start off screen
  }
}
