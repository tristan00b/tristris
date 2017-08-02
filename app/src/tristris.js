/*
  tristris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tristrist clone...
  Created: June 23, 2017
  License: GPLv3
*/

import config from './config.js'
import {EventObserver, EventDispatcher} from './event.js'
import InputHandler from './input.js'
import Graphics from './graphics.js'
import SoundPlayer from './audio.js'
import Arena from './arena.js'
import Player from './player.js'

export default class Tristris {

  constructor(canvas) {

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

    this.dispatcher = EventDispatcher.getInstance()
    this.observer = new EventObserver()
    this.observer.addHandler('game/togglePause', () => this.togglePause())
    this.observer.addHandler('arena/overflows', () => this.restartGame())
    this.observer.addHandler('player/scoreUpdated', () => this.displayScore())
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

    this.dispatcher.dispatch(new Event('game/started'))
  }

  requestAnimationFrame() {
    this.frame.id = requestAnimationFrame(time => this.loop(time))
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.frame.id)
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
    this.resetFrameRate()
    this.cancelAnimationFrame()
  }

  loop(currentTime = 0) {

    this.updateFrameRate(currentTime)

    this.time.delta += Math.max(0, currentTime - this.time.prev)
    this.time.prev = currentTime

    let timer = this.time.timeout
    while(this.time.delta >= this.time.step && timer--) {
      this.update(this.time.step)
      this.time.delta -= this.time.step
      if (0 === timer) this.time.delta = 0
    }

    this.draw()
    this.requestAnimationFrame()
  }

  updateFrameRate(time) {
    if (time > this.frame.nextRateUpdate) {
      this.frame.rate = 0.75*this.frame.count + 0.25*this.frame.rate
      this.frame.nextRateUpdate = time + 1000
      this.frame.count = 0
      this.displayFrameRate()
    }
    this.frame.count++
  }

  resetFrameRate() {
    this.frame.rate = 0
    this.frame.count = 0
    this.displayFrameRate()
  }

  pause() {
    this.stop()
    this.dispatcher.dispatch(new Event('game/paused'))
  }

  unpause() {
    this.start()
    this.dispatcher.dispatch(new Event('game/unpaused'))
  }

  togglePause() {
    this.paused = !this.paused
    this.paused ? this.pause() : this.unpause()
  }

  restartGame() {
    this.displayHighscore()
    this.dispatcher.dispatch(new Event('game/restarted'))
  }

  displayScore() {
    this.text.score.innerHTML = `You have ${this.player.score} points` +
      (this.player.score > 100000 ? '!' : '.')
  }

  displayHighscore() {
    this.text.highscore.innerHTML = `Highscore ${this.player.highscore} points.`
  }

  displayFrameRate() {
    this.text.frameRate.innerHTML = 'FPS: ' +
      parseFloat(Math.round(this.frame.rate*10)/10).toFixed(1)
  }
}
