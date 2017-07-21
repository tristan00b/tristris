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

import {EventObserver} from './event.js'
import {zeroMatrix} from './util.js'

export default class Arena {

  constructor(game) {

    this.context = game.context.main
    this.graphics = game.graphics
    this.config = game.config

    let size = game.config.graphics.grid.main.size
    this.grid = {
      array: zeroMatrix(size.w, size.h),
      size: size
    }

    this.dispatcher = game.dispatcher
    this.observer = new EventObserver()
    this.observer.addHandler('tristris/game/restarted', () => this.restart())
    this.observer.registerHandlers(this.dispatcher)
  }

  update() {
    this.sweep()
  }

  draw() {
    this.graphics.drawTiles(this.context, this.grid.array)
  }

  merge(player) {

    if (this.overflows(player)) {
      this.dispatcher.dispatch(new Event('tristris/arena/overflows'))
      return // don't merge on overflow
    }

    let {pos, array: piece} = player.curr
    piece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.grid.array[pos.y + y][pos.x + x] = value
        }
      })
    })
  }

  sweep() {
    let {size: {w, h}, array: oldGrid} = this.grid
    let newGrid = zeroMatrix(w, h)
    let rowsCleared = 0
    for (let i=h-1; i>=0; --i) {
      if (oldGrid[i].every(x => x > 0)) {
        rowsCleared++
        continue
      }
      oldGrid[i].forEach((value, j) => {
        newGrid[i+rowsCleared][j] = oldGrid[i][j]
      })
    }

    this.grid.array = newGrid

    if (rowsCleared) {
      this.dispatcher.dispatch(Object.assign(
        new Event('tristris/arena/rowsCleared'),
        {rowsCleared: rowsCleared}
      ))
    }
  }

  get size() {
    return this.config.graphics.grid.main.size
  }

  columnHeights(player) {
    let {size: {w, h}, array: grid} = this.grid

    let heights = Array(w).fill(h)

    for (let j = 0; j < w; ++j) {
      for (let i = Math.max(0, player.bottom); i < h; ++i) {
        if (grid[i][j]) {
          heights[j] = i
          break
        }
      }
    }
    return heights
  }

  checkForCollision(player) {

    let {pos, array} = player.curr
    let {size: {w, h}, array: grid} = this.grid
    let xpos, ypos;

    for (let y = 0; y < array.length; ++y) {
      for (let x = 0; x < array.length; ++x) {

        // nothing to do if a tile is empty so check this first
        if (array[y][x]) {

          xpos = x + pos.x
          ypos = y + pos.y

          if (xpos < 0) {
            return Arena.collisionDirection.LEFT
          }

          if (xpos >= w) {
            return Arena.collisionDirection.RIGHT
          }

          if ((ypos >= 0) && (ypos >= h || grid[ypos][xpos])) {
            return Arena.collisionDirection.BOTTOM
          }
        }
      }
    }
  }

  overflows(player) {
    // Return true if any non-empty tile of the player piece is above the top
    // of the arena grid. Only the first line above the top needs to be checked.
    const {array: piece, pos} = player.curr

    if (pos.y >=0) return false // can't overflow with nonnegative y value

    let firstLineOverTop = Math.min(piece.size, piece.size+pos.y) - 1
    let doesOverflow = piece[firstLineOverTop].some(x => x > 0)

    return doesOverflow
  }

  restart() {
    this.grid.array.forEach((row, y) => {
      row.forEach((value, x) => {
        this.grid.array[y][x] = 0
      })
    })
  }

}

Arena.collisionDirection = Object.freeze({
  LEFT: "left",
  BOTTOM: "bottom",
  RIGHT: "right"
})
