/*
  player.js

  Author:  J. Tristan Bayfield
  Desc:    Defines the Player class, which represents the current tile and it's
           position, on the board as well as provides methods for translation.
           and rotation.
  Created: June 23, 2017
  License: GPLv3
*/

import Arena from './arena.js'
import config from './config.js'
import {EventDispatcher, EventObserver} from './event.js'
import {deepCopy, zeroMatrix, Point, Rect} from './util.js'

export default class Player {

  constructor(game) {
    this.arena = game.arena
    this.canvas = game.canvas
    this.context = game.context
    this.dimensions = game.dimensions
    this.flags = {}
    this.graphics = game.graphics
    this.highscore = 0
    this.score = 0
    this.time = {
      accumulated: 0,
      step: 1000
    }

    this.dispatcher = EventDispatcher.getInstance()
    this.observer = new EventObserver()
    this.observer.addHandler('arena/rowsCleared', data =>
      this.updateScore(data.rowsCleared))
    this.observer.addHandler('game/restarted', () => this.restart())
    this.observer.addHandler('player/hold', () => this.hold())
    this.observer.addHandler('player/moveDown', () => this.moveDown())
    this.observer.addHandler('player/moveLeft', () => this.moveSideways(-1))
    this.observer.addHandler('player/moveRight', () => this.moveSideways(1))
    this.observer.addHandler('player/rotate', () => this.rotateRight())
    this.observer.addHandler('player/slam', () => this.slam())
    this.observer.registerHandlers(this.dispatcher)

    this.restart()
  }

  update(dt) {
    const {time} = this
    time.accumulated += dt;
    if (time.accumulated >= time.step) {
      time.accumulated = 0
      this.moveDown()
    }
  }

  draw() {

    const dim = this.dimensions

    function tileOnGrid(pos) {
      return pos.x >= 0 && pos.x < dim.grid.main.size.w
          && pos.y >= 0 && pos.y < dim.grid.main.size.h
    }

    const options = {
      tileFilter: (pos) => !tileOnGrid(pos)
    }

    // Draw player piece shadow
    options.origin = dim.grid.main.rect
    options.pos = this.slamPos
    options.fillStyle = '#222'
    options.strokeStyle = '#444'
    options.alpha = 0.5
    this.graphics.drawTiles(this.curr.array, options)

    // Draw player piece (draw after shadow; may overlap)
    options.pos = this.curr.pos
    options.fillStyle = null
    options.strokeStyle = 'white'
    options.alpha = 1
    this.graphics.drawTiles(this.curr.array, options)

    // Draw next piece
    this.flags.nextPieceUpdated = false
    options.origin = dim.grid.next.rect
    options.pos = this.next.pos
    this.graphics.drawTiles(this.next.array, options)

    // Draw held piece
    if (!this.held) return
    this.flags.heldPieceUpdated = false
    options.origin = dim.grid.held.rect
    options.pos = this.held.pos
    this.graphics.drawTiles(this.held.array, options)
  }

  translate(amt) {
    this.curr.pos.y += amt.y
    this.curr.pos.x += amt.x
  }

  moveSideways(dx) {
    this.translate(new Point(dx, 0))
    if (this.arena.checkForCollision(this)) {
      this.translate(new Point(-dx, 0))
    }
  }

  moveDown() {
    // Reset accumulator every time the piece moves down
    this.time.accumulated = 0

    this.translate(new Point(0, 1))

    if (this.arena.checkForCollision(this)) {
      this.translate(new Point(0, -1))
      this.arena.merge(this)
      this.reset()
    }
  }

  rotate() {
    const orig = this.curr.array
    const rotated = zeroMatrix(this.curr.array.length)

    orig.forEach((row, i) => {
      row.forEach((val, j) => {
        rotated[j][i] = val
      })
    })
    rotated.forEach(row => row.reverse())
    this.curr.array = rotated

    this.dispatcher.dispatch(new Event('player/rotated'))
  }

  rotateRight() {
    const orig = this.curr.array
    this.rotate()

    // A rotation next to a wall can result in collision. When this happens,
    // we'll translate left or right to move the piece out of the way. As we do
    // not know my how much the piece extends pass the wall, we move the piece
    // then retest for collision one step at at time. The number of required
    // checks is bounded by the size of the piece.

    for(let i=0; i < this.curr.array.length; ++i) {
      let dir = this.arena.checkForCollision(this)

      if (dir === Arena.collisionDirection.LEFT) {
        this.translate(new Point(1, 0))
      }

      else if (dir === Arena.collisionDirection.RIGHT) {
        this.translate(new Point(-1, 0))
      }

      else if (dir === Arena.collisionDirection.BOTTOM) {
        this.curr.array = orig
      }
    }
  }

  get size() {
    return {
      w: this.curr.array.length,
      h: this.curr.array.length
    }
  }

  get top() {
    const {w, h} = this.size
    const piece = this.curr.array
    let top = h;
    for (let j = 0; j < w; ++j) {
      for (let i = 0; i < h; ++i) {
        if (piece[i][j]) {
          top = Math.min(i, top)
          break
        }
      }
    }
    return this.curr.pos.y + top
  }

  get bottom() {
    const {w, h} = this.size
    const piece = this.curr.array
    let bottom = 0;
    for (let j = 0; j < w; ++j) {
      for (let i = h - 1; i >= 0; --i) {
        if (piece[i][j]) {
          bottom = Math.max(i, bottom)
          break
        }
      }
    }
    return this.curr.pos.y + bottom
  }

  get slamPos() {
    const {pos, array: piece} = this.curr
    const colHeights = this.arena.columnHeights(this)
    let minDist = this.arena.size.h + this.size.h

    for (let j = 0; j < this.size.h; ++j) {
      for (let i = this.size.h - 1; i >= 0; --i) {
        if (piece[i][j]) {
          minDist = Math.min(colHeights[j+pos.x] - (i+pos.y), minDist)
          break
        }
      }
    }

    return new Point(pos.x, pos.y + minDist - 1)
  }

  slam() {
    this.curr.pos = this.slamPos
    this.arena.merge(this)
    this.reset()
    this.dispatcher.dispatch(new Event('player/slammed'))
  }

  hold() {
    const heldPiece = this.held
    this.held = this.newPiece(this.curr.shape)

    if (heldPiece && heldPiece.shape) {
      this.curr = heldPiece
      this.curr.pos = new Point(
        (config.graphics.grid.main.size.w - this.curr.array.length)/2|0,
        -this.curr.array.length
      )
    } else {
      this.reset()
    }

    this.next.pos = this.centerPosition(this.next, config.graphics.grid.next)
    this.held.pos = this.centerPosition(this.held, config.graphics.grid.held)
  }

  newPiece(shape) {
    return Object.assign(
      {shape: shape, pos: new Point},
      deepCopy(config.tetrominos.shapes[shape])
    )
  }

  chooseNewPiece() {
    const freq = config.tetrominos.frequencies
    const shape = freq[Math.random() * freq.length | 0]
    return this.newPiece(shape)
  }

  centerPosition(piece, grid) {
    return new Point(
      0.5*grid.size.w - piece.center.x,
      0.5*grid.size.h - piece.center.y
    )
  }

  get next() {
    return this._next
  }

  set next(newPiece) {
    this._next = newPiece
    this.flags.nextPieceUpdated = true
  }

  get held() {
    return this._held
  }

  set held(newPiece) {
    this._held = newPiece
    this.flags.heldPieceUpdated = true
  }

  reset() {
    this.curr = this.next
    this.next = this.chooseNewPiece()

    this.curr.pos = new Point(
      (config.graphics.grid.main.size.w - this.curr.array.length)/2|0,
      -this.curr.array.length
    )

    this.next.pos = this.centerPosition(this.next, config.graphics.grid.next)
  }

  restart() {
    this.score = 0
    this.next = this.chooseNewPiece()
    this._held = null
    this.reset()
  }

  updateScore(rowsCleared) {
    if (rowsCleared == 0) return
    this.score = this.score + (rowsCleared ? 10**rowsCleared : 0)
    this.highscore = this.score > this.highscore ? this.score : this.highscore
    this.dispatcher.dispatch(new Event('player/scoreUpdated'))
  }

}
