/*
  tristris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tristrist clone...
           The tristris class defined hear contains the game logic for contorlling
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

export default class Tristris {

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
      highscore: document.getElementById('highscore-text'),
      frameRate: document.getElementById('frame-rate')
    }

    this.dispatcher = new EventDispatcher()
    this.observer = new EventObserver()
    this.observer.addHandler('tristris/game/togglePause', () => this.togglePause())
    this.observer.addHandler('tristris/arena/overflows', () => this.restartGame())
    this.observer.addHandler('tristris/player/scoreUpdated', () => this.updateScore())
    this.observer.registerHandlers(this.dispatcher)

    this.input = new InputHandler(this)
    this.graphics = new Graphics(this)
    this.audio = new SoundPlayer(this)
    this.arena = new Arena(this)
    this.player = new Player(this)

    this.paused = false
    this.state = 'running'

    this.frame =  {
      id: null,
      count: 0,
      rate: 0,
      maxRate: 60,
      nextRateUpdate: 0,
    }

    this.time = {
      prev: 0,
      delta: 0,
      step: 1000/this.frame.maxRate,
      timeout: this.frame.maxRate,
    }

    this.dispatcher.dispatch(new Event('tristris/game/started'))
  }

  requestAnimationFrame() {
    return requestAnimationFrame(time => this.loop(time))
  }

  update(dt = 0) {
    this.input.update()
    this.player.update(dt)
    this.arena.update()
  }

  draw() {
    const {canvas: c, context: ctx} = this
    ctx.main.clearRect(0, 0, c.main.width, c.main.height)
    this.player.draw()
    this.arena.draw()
    this.displayFrameRate()
  }

  start() {
    // We need to request two frames when restarting the loop in order to
    // correctly reset the previous timestamp
    this.frame.id = requestAnimationFrame(time => {
      this.time.prev = time
      this.requestAnimationFrame()
    })
  }

  stop() {
    cancelAnimationFrame(this.frame.id)
  }

  loop(time = 0) {

    function calcFrameRate(time) {
      if (time > this.frame.nextRateUpdate) {
        this.frame.rate = 0.75*this.frame.count + 0.25*this.frame.rate
        this.frame.nextRateUpdate = time + 1000
        this.frame.count = 0
      }
      this.frame.count++
    }

    // Cap frame-rate
    if (time < (this.time.prev + this.time.step)) {
      this.frame.id = this.requestAnimationFrame()
      return
    }
    calcFrameRate.call(this, time)

    this.time.delta += Math.max(0, time - this.time.prev)
    this.time.prev = time

    for (
      let timeout = 0
      ; this.time.delta >= this.time.step
      ; this.time.delta -= this.time.step, timeout++
    ) {
      this.update(this.time.step)
      if (timeout > this.time.timeout) {
        this.time.delta = 0
        break
      }
    }

    this.draw()
    this.frame.id = this.requestAnimationFrame()
  }

  pause() {
    this.stop()
    this.dispatcher.dispatch(new Event('tristris/game/paused'))
  }

  unpause() {
    this.start()
    this.dispatcher.dispatch(new Event('tristris/game/unpaused'))
  }

  togglePause() {
    this.paused = !this.paused
    this.paused ? this.pause() : this.unpause()
  }

  restartGame() {
    this.updateHighscore()
    this.dispatcher.dispatch(new Event('tristris/game/restarted'))
  }

  updateScore() {
    this.text.score.innerHTML = `You have ${this.player.score} points` +
      (this.player.score > 100000 ? '!' : '.')
  }

  updateHighscore() {
    this.text.highscore.innerHTML = `Highscore ${this.player.highscore} points.`
  }

  displayFrameRate() {
    // Report to 1 decimal place
    this.text.frameRate.innerHTML = 'FPS: ' +
      parseFloat(Math.round(this.frame.rate*10)/10).toFixed(1)
  }
}
