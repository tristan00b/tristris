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
import InputHandler from './input.js'
import Graphics from './graphics.js'
import SoundPlayer from './audio.js'
import Arena from './arena.js'
import Player from './player.js'

export default class Tetris {

  constructor(canvas, config) {

    this.config = config

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

    this.dispatcher = new EventDispatcher()
    this.observer = new EventObserver()
    this.observer.addHandler('tetris/game/togglePause', () => this.togglePause())
    this.observer.addHandler('tetris/arena/overflows', () => this.restartGame())
    this.observer.registerHandlers(this.dispatcher)

    this.input = new InputHandler(this)
    this.graphics = new Graphics(this)
    this.audio = new SoundPlayer(this)
    this.arena = new Arena(this)
    this.player = new Player(this)

    this.paused = false
    this.prevTime = 0
    this.state = 'running'

    this.dispatcher.dispatch(new Event('tetris/game/started'))
  }

  update(dt = 0) {
    this.input.update()
    this.player.update(dt)
    this.arena.update()
    this.updateScore()
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
    this.update(time - this.prevTime)
    this.draw()
    this.prevTime = time
    this.animationFrameId = requestAnimationFrame(time => this.loop(time))
  }

  pauseGame() {
    cancelAnimationFrame(this.animationFrameId)
    this.dispatcher.dispatch(new Event('tetris/game/paused'))
  }

  unpauseGame() {
    this.loop(this.prevTime)
    this.dispatcher.dispatch(new Event('tetris/game/unpaused'))
  }

  togglePause() {
    this.paused = !this.paused
    this.paused ? this.pauseGame() : this.unpauseGame()
  }

  restartGame() {
    this.updateHighscore()
    this.dispatcher.dispatch(new Event('tetris/game/restarted'))
  }

  updateScore() {
    this.text.score.innerHTML = `You have ${this.player.score} points` +
      (this.player.score > 100000 ? '!' : '.')
  }

  updateHighscore() {
    this.text.highscore.innerHTML = `Highscore ${this.player.highscore} points.`
  }
}
