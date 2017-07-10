/*
  tetris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tetrist clone...
           The Tetris class defined hear contains the game logic for contorlling
           and manipulating the player's piece and board.
  Created: June 23, 2017
  License: GPLv3
*/

import {EventObserver, EventDispatcher} from './event.js'
import Input from './input.js'
import Graphics from './graphics.js'
import SoundPlayer from './audio.js'
import Arena from './arena.js'
import Player from './player.js'

export default class Tetris extends EventObserver {

  constructor(canvas, config) {

    super()

    this.config = config
    this.time = {
      accumulated: 0,
      prev: 0,
      step: 1000,
    }
    this.paused = false

    let {grid: g, tileScale: scale} = config.graphics
    canvas.main.width = g.main.size.w * scale
    canvas.main.height = g.main.size.h * scale
    canvas.next.width = g.auxiliary.size.w * scale
    canvas.next.height = g.auxiliary.size.h * scale
    canvas.held.width = g.auxiliary.size.w * scale
    canvas.held.height = g.auxiliary.size.h * scale
    this.canvas = canvas

    this.context = {
      main: canvas.main.getContext('2d'),
      next: canvas.next.getContext('2d'),
      held: canvas.held.getContext('2d'),
    }

    this.text = {
      score: document.getElementById('score-text'),
      highscore: document.getElementById('highscore-text')
    }

    this.eventDispatcher = new EventDispatcher()

    this.input = new Input(this)
    this.graphics = new Graphics(this)
    this.audio = new SoundPlayer(this)
    this.arena = new Arena(this)
    this.player = new Player(this)

    this.addHandler('tetris/player/hold', () => this.player.hold())
    this.addHandler('tetris/player/moveDown', () => this.lowerPlayer())
    this.addHandler('tetris/player/moveLeft', () => this.movePlayer(-1))
    this.addHandler('tetris/player/moveRight', () => this.movePlayer(1))
    this.addHandler('tetris/player/rotate', () => this.rotatePlayer())
    this.addHandler('tetris/game/togglePause', () => this.togglePause())
    this.subscribe(this.eventDispatcher)

    this.eventDispatcher.dispatch(new Event('tetris/game/started'))
  }

  update(dt = 0) {
    let time = this.time
    time.accumulated += dt;
    if (time.accumulated >= time.step) {
      time.accumulated = 0
      this.lowerPlayer()
    }
  }

  draw() {
    const {canvas: c, context: ctx} = this
    ctx.main.clearRect(0, 0, c.main.width, c.main.height)
    ctx.next.clearRect(0, 0, c.next.width, c.next.height)
    ctx.held.clearRect(0, 0, c.held.width, c.held.height)
    this.player.draw()
    this.arena.draw()
  }

  loop(time = 0) {
    this.update(time - this.time.prev)
    this.draw()
    this.time.prev = time
    this.time.animationFrameId = requestAnimationFrame(time => this.loop(time))
  }

  lowerPlayer() {

    let {arena, player} = this

    // Reset Accumulator every time the piece is dropped
    this.time.accumulated = 0

    player.translate({x: 0, y: 1})

    if (arena.checkForCollision(player)) {

      player.translate({x: 0, y: -1})

      if (arena.overflows(player)) {
        this.updateHighscore()
        this.restartGame()
      } else {
        arena.merge(player)
      }

      this.player.updateScore(arena.sweep())
      this.player.reset()
      this.updateScore();
    }
  }

  movePlayer(dx) {
    this.player.translate({x: dx, y:0})
    if (this.arena.checkForCollision(this.player)) {
      this.player.translate({x: -dx, y:0})
    }
  }

  rotatePlayer() {

    let {arena, player} = this

    let orig = player.curr.array
    player.rotate()

    // A rotation next to a wall can result in collision. When this happens,
    // we'll translate left or right to move the piece out of the way. As we do
    // not know my how much the piece extends pass the wall, we move the piece
    // then retest for collision one step at at time. The number of required
    // checks is bounded by the size of the piece.

    for(let i=0; i < player.curr.array.length; ++i) {
      let dir = arena.checkForCollision(player)

      // LHS collision
      if (dir === -1) {
        player.translate({x:1, y:0})
      }

      // RHS collision
      else if (dir === 1) {
        player.translate({x:-1, y:0})
      }

      // Bottom collision
      else if (dir === true) {
        // player.translate({x:0, y:-1})
        player.curr.array = orig
      }
    }
  }

  resetPlayer() {
    this.player.reset()
  }

  restartGame() {
    this.player.score = 0
    this.arena.reset()
  }

  updateScore() {
    this.text.score.innerHTML = `You have ${this.player.score} points` +
      (this.player.score > 100000 ? '!' : '.')
  }

  updateHighscore() {
    this.text.highscore.innerHTML = `Highscore ${this.player.highscore} points.`
  }

  togglePause() {
    this.paused = !this.paused
    this.paused ? this.pauseGame() : this.unpauseGame()
  }

  pauseGame() {
    cancelAnimationFrame(this.time.animationFrameId)
    this.eventDispatcher.dispatch(new Event('tetris/game/paused'))
  }

  unpauseGame() {
    this.loop(this.time.prev)
    this.eventDispatcher.dispatch(new Event('tetris/game/unpaused'))
  }
  
}
