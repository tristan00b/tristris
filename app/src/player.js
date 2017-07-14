/*
  player.js

  Author:  J. Tristan Bayfield
  Desc:    Defines the Player class, which represents the current tile and it's
           position, on the board as well as provides methods for translation
           and rotation.
  Created: June 23, 2017
  License: GPLv3
*/

import {EventObserver} from './event.js'
import {deepCopy, zeroMatrix} from './util.js'

export default class Player {

  constructor(game) {

    this.canvas = game.canvas
    this.context = game.context
    this.config = game.config.graphics
    this.graphics = game.graphics
    this.arena = game.arena
    this.score = 0
    this.highscore = 0
    this.time = {
      accumulated: 0,
      step: 1000
    }

    this.dispatcher = game.dispatcher
    this.observer = new EventObserver()
    this.observer.addHandler('tetris/arena/rowsCleared', (data) => {
      this.updateScore(data.rowsCleared)
    })
    this.observer.addHandler('tetris/game/restarted', () => this.restart())
    this.observer.addHandler('tetris/player/hold', () => this.hold())
    this.observer.addHandler('tetris/player/moveDown', () => this.moveDown())
    this.observer.addHandler('tetris/player/moveLeft', () => this.move(-1))
    this.observer.addHandler('tetris/player/moveRight', () => this.move(1))
    this.observer.addHandler('tetris/player/rotate', () => this.rotateRight())
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
    this.graphics.drawTiles(this.context.main, this.curr.array, this.curr.pos)
    this.graphics.drawTiles(this.context.next, this.next.array, this.next.pos)
    this.graphics.drawTiles(this.context.held, this.held.array, this.held.pos)
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

    this.dispatcher.dispatch(new Event('tetris/player/rotated'))
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

      // LHS collision
      if (dir === -1) {
        this.translate({x:1, y:0})
      }

      // RHS collision
      else if (dir === 1) {
        this.translate({x:-1, y:0})
      }

      // Bottom collision
      else if (dir === true) {
        // player.translate({x:0, y:-1})
        this.curr.array = orig
      }
    }
  }

  hold() {

    let temp = this.held
    this.held = this.newPiece(this.curr.shape)

    if (temp.shape) {
      this.curr = temp
      this.curr.pos = {
        x: (this.config.grid.main.size.w - this.curr.array.length)/2|0,
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
  }

}
