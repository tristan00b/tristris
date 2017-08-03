/*
  game.js

  Author:  J. Tristan Bayfield
  Created: July 30, 2017
  License: GPLv3
*/

import config from './config.js'
import {EventDispatcher, EventObserver} from './event.js'
import {InputHander} from './input.js'
import {StateMachine} from './state.js'
import Pause from './pause.js'
import Tristris from './tristris.js'

export default class Game {

  constructor(canvas) {

    this.machine = new StateMachine({
      initialState: 'game',
      states: {
        // 'menu'  : MenuState,
        'game'  : Tristris,
        'pause' : Pause,
      },
      transitions: [
        // ['game/start',      'menu',  'game'],
        // ['game/exitToMenu', 'game',  'menu'],
        ['game/pause',      'game',  'pause'],
        ['game/unpause',    'pause', 'game'],
      ]
    })

    this.text = {
      frameRate: document.getElementById('frame-rate')
    }

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
  }

  requestAnimationFrame() {
    this.frame.id = requestAnimationFrame(time => this.loop(time))
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.frame.id)
  }

  get state() {
    return this.machine.state
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

  update(dt = 0) {
    this.state.update(dt)
  }

  draw() {
    this.state.draw()
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

  displayFrameRate() {
    this.text.frameRate.innerHTML = 'FPS: ' +
      parseFloat(Math.round(this.frame.rate*10)/10).toFixed(1)
  }
}
