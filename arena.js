/*
  arena.js

  Author:  J. Tristan Bayfield
  Desc:    Defines the Arena class, representing the board and pieces that have
           been played so far. Offers collision detection between the player's
           current piece and tiles remaining on the board, as well as a sweep
           method for clearing complete lines.
  Created: June 23, 2017
  License: GPLv3
*/

class Arena {

  constructor(tetris, width=11, height=20) {
    this.context = tetris.context
    this.width = width
    this.height = height
    this.startPosition = {x:width/2|0, y:0}
    this.grid = zeroMatrix(width, height)
    this.reset()
  }

  draw() {
    this.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawTile(this.context, x, y, pieceColours[value-1])
        }
      })
    })
  }

  merge(player) {
    let {pos, piece} = player
    let {x: xOffset, y: yOffset} = pos

    piece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.grid[y + yOffset][x + xOffset] = value
        }
      })
    })
  }

  sweep() {
    let newGrid = zeroMatrix(this.width, this.height)
    let rowsCleared = 0
    for (let i=this.height-1; i>=0; --i) {
      if (this.grid[i].every(x => x > 0)) {
        rowsCleared++
        continue
      }
      this.grid[i].forEach((value, j) => {
        newGrid[i+rowsCleared][j] = this.grid[i][j]
      })
    }
    this.grid = newGrid
    return rowsCleared
  }

  checkForCollision(player) {

    let collisionDetected = false
    let {pos, piece, size} = player

    for (let y = 0; y < size; ++y) {
      for (let x = 0; x < size; ++x) {

        // nothing to do if a tile is empty so check this first
        if (piece[y][x]) {

          // collision with LHS wall
          if (x + pos.x < 0) {
            collisionDetected = -1
            break
          }

          // collision with RHS wall
          if (x + pos.x  >= this.width) {
            collisionDetected = 1
            break
          }

          // or a collision with either the floor or another tile on the board
          if (y + pos.y >= 0 // tiles can be 'offscreen' so avoid bad indices
              && (y + pos.y >= this.height
                  || this.grid[y + pos.y][x + pos.x])) {
            collisionDetected = true
            break
          }
        }
      }
    }
    return collisionDetected
  }

  overflows(player) {
    // Return true if any non-empty tile of the player piece is above the top
    // of the arena grid. Only the first line above the top needs to be checked.
    let y = player.pos.y
    let firstLineOver = player.size - (player.size+y) - 1 // assumes negative y
    return (y < 0 && player.piece[firstLineOver].some(x => x > 0))
  }

  reset() {
    this.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        this.grid[y][x] = 0
      })
    })
  }
}
