/*
  player.js

  Author:  J. Tristan Bayfield
  Desc:    Defines the Player class, which represents the current tile and it's
           position, on the board as well as provides methods for translation
           and rotation.
  Created: June 23, 2017
  License: GPLv3
*/

import Arena from './arena.js'
import {EventObserver} from './event.js'
import {deepCopy, zeroMatrix} from './util.js'

export default class Player {

  constructor(game) {

    this.arena = game.arena
    this.canvas = game.canvas
    this.config = game.config
    this.context = game.context
    this.flags = []
    this.graphics = game.graphics
    this.highscore = 0
    this.score = 0
    this.time = {
      accumulated: 0,
      step: 1000
    }

    this.dispatcher = game.dispatcher
    this.observer = new EventObserver()
    this.observer.addHandler('tristris/arena/rowsCleared', (data) => {
      this.updateScore(data.rowsCleared)
    })
    this.observer.addHandler('tristris/game/restarted', () => this.restart())
    this.observer.addHandler('tristris/player/hold', () => this.hold())
    this.observer.addHandler('tristris/player/moveDown', () => this.moveDown())
    this.observer.addHandler('tristris/player/moveLeft', () => this.move(-1))
    this.observer.addHandler('tristris/player/moveRight', () => this.move(1))
    this.observer.addHandler('tristris/player/rotate', () => this.rotateRight())
    this.observer.addHandler('tristris/player/slam', () => this.slam())
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
    this.drawMainCanvas()
    this.drawHeldCanvas()
    this.drawNextCanvas()
  }

  drawMainCanvas() {
    this.graphics.drawShadow(this.context.main, this.curr.array, this.slamPos)
    this.graphics.drawTiles(this.context.main, this.curr.array, this.curr.pos)
  }

  drawHeldCanvas() {
    if (this.flags.heldPieceUpdated) {
      this.flags.heldPieceUpdated = false
      this.context.held.clearRect(0, 0, this.canvas.held.width, this.canvas.held.height)
      this.graphics.drawTiles(this.context.held, this.held.array, this.held.pos)
    }
  }

  drawNextCanvas() {
    if (this.flags.nextPieceUpdated) {
      this.flags.nextPieceUpdated = false
      this.context.next.clearRect(0, 0, this.canvas.next.width, this.canvas.next.height)
      this.graphics.drawTiles(this.context.next, this.next.array, this.next.pos)
    }
  }

  translate(amt) {
    this.curr.pos.y += amt.y
    this.curr.pos.x += amt.x
  }

  move(dx) {
    this.translate({x: dx, y:0})
    if (this.arena.checkForCollision(this)) {
      this.translate({x: -dx, y:0})
    }
  }

  moveDown() {

    // Reset Accumulator every time the piece is dropped
    this.time.accumulated = 0

    this.translate({x: 0, y: 1})

    if (this.arena.checkForCollision(this)) {
      this.translate({x: 0, y: -1})
      this.arena.merge(this)
      this.reset()
    }
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

    this.dispatcher.dispatch(new Event('tristris/player/rotated'))
  }

  rotateRight() {

    let orig = this.curr.array
    this.rotate()

    // A rotation next to a wall can result in collision. When this happens,
    // we'll translate left or right to move the piece out of the way. As we do
    // not know my how much the piece extends pass the wall, we move the piece
    // then retest for collision one step at at time. The number of required
    // checks is bounded by the size of the piece.

    for(let i=0; i < this.curr.array.length; ++i) {
      let dir = this.arena.checkForCollision(this)

      if (dir === Arena.collisionDirection.LEFT) {
        this.translate({x:1, y:0})
      }

      else if (dir === Arena.collisionDirection.RIGHT) {
        this.translate({x:-1, y:0})
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
      for (let i = h-1; i >= 0; --i) {
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

    return {
      x: pos.x,
      y: pos.y + minDist - 1
    }
  }

  slam() {
    this.curr.pos = this.slamPos
    this.dispatcher.dispatch(new Event('tristris/player/slammed'))
    this.arena.merge(this)
    this.reset()
  }

  hold() {

    let temp = this.held
    this.held = this.newPiece(this.curr.shape)

    if (temp.shape) {
      this.curr = temp
      this.curr.pos = {
        x: (this.config.graphics.grid.main.size.w - this.curr.array.length)/2|0,
        y: -this.curr.array.length
      }
    } else {
      this.reset()
    }

    this.next.pos = this.centerPosition(this.next, this.canvas.next)
    this.held.pos = this.centerPosition(this.held, this.canvas.held)
  }

  newPiece(shape) {
    return Object.assign(
      {shape: shape, pos: {x: 0, y: 0}},
      deepCopy(this.config.graphics.tetrominos.shapes[shape])
    )
  }

  chooseNewPiece() {
    const freq = this.config.graphics.tetrominos.frequencies
    const shape = freq[Math.random() * freq.length | 0]
    return this.newPiece(shape)
  }

  centerPosition(piece, canvas) {
    return {
      x: canvas.width/(this.config.graphics.tileScale*2) - piece.center.x,
      y: canvas.height/(this.config.graphics.tileScale*2) - piece.center.y
    }
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

    this.curr.pos = {
      x: (this.config.graphics.grid.main.size.w - this.curr.array.length)/2|0,
      y: -this.curr.array.length
    }

    this.next.pos = this.centerPosition(this.next, this.canvas.next)
  }

  restart() {
    this.score = 0
    this.next = this.chooseNewPiece()
    this.held = {
      shape: '',
      array: [],
      pos: {x: 0, y: 0}
    }
    this.reset()
  }

  updateScore(rowsCleared) {
    if (rowsCleared == 0) return
    this.score = this.score + (rowsCleared ? 10**rowsCleared : 0)
    this.highscore = this.score > this.highscore ? this.score : this.highscore
    this.dispatcher.dispatch(new Event('tristris/player/scoreUpdated'))
  }

}
