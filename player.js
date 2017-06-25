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
    this.piece = null
    this.pos = null
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

  chooseNewPiece() {
    let l = pieces[Math.random()*pieces.length | 0]
    this.piece = tetrominos[l]
    this.size = this.piece.length
  }

  setPosition(pos) {
    this.pos = pos
  }

  reset() {
    this.chooseNewPiece()

    let {x, y} = this.tetris.arena.startPosition

    this.setPosition({
      x: x - this.size/2|0,
      y: y - this.size
    })
  }
}
