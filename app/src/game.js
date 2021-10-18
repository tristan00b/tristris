/*
  game.js

  Author:  J. Tristan Bayfield
  Created: July 30, 2017
  License: GPLv3
*/

import { getCanvas,
         getContext   } from './util.js'
import { StateMachine } from './state.js'
import   Graphics       from './graphics.js'
import   Pause          from './pause.js'
import   Title          from './title.js'
import   Tristris       from './tristris.js'
import   SoundPlayer    from './audio.js'


export default class Game {

  constructor(config) {

    const buildinfo   = document.querySelector('build-info')
    config.debug      = !!buildinfo.attributes.debug
    config.appVersion = buildinfo.attributes.build.value || ""

    this.config   = Object.freeze(config)
    this.canvas   = getCanvas(this.config.graphics.canvas.id)
    this.context  = getContext(this.canvas)
    this.audio    = new SoundPlayer(this)
    this.graphics = new Graphics(this)

    this.stateMachine = new StateMachine(this, {
      initialState: this.config.debug ? 'game' : 'title',
      states: {
        'pause' : Pause,
        'game'  : Tristris,
        'title' : Title,
      },
      transitions: [
        ['game/start',       'title', 'game' ],
        ['game/exitToTitle', 'game',  'title'],
        ['game/exitToTitle', 'title', 'title'],
        ['game/pause',       'game',  'pause'],
        ['game/unpause',     'pause', 'game' ],
      ]
    })

    this.text = {
      frameRate: document.getElementById('frame-rate'),
      appVersion: document.getElementById('app-version')
    }
    this.text.appVersion.innerHTML = `Build: ${this.config.appVersion}`

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

    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  resize() {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const scale = this.config.graphics.canvas.relativeSize
    const w = scale.w * window.innerWidth
    const h = scale.h * window.innerHeight

    canvas.width = w
    canvas.height = h
    context.drawImage(this.canvas, 0, 0)
    this.canvas.width  = w
    this.canvas.height = h
    this.context.drawImage(canvas, 0, 0)
    this.state.resize()
  }

  requestAnimationFrame() {
    this.frame.id = requestAnimationFrame(time => this.loop(time))
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.frame.id)
  }

  get state() {
    return this.stateMachine.state
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
