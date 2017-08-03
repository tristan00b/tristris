/*
  tristris.js

  Author:  J. Tristan Bayfield
  Desc:    Yet another tristrist clone...
  Created: June 23, 2017
  License: GPLv3
*/

import config from './config.js'
import {EventObserver, EventDispatcher} from './event.js'
import {State} from './state.js'
import Arena from './arena.js'
import Player from './player.js'
import Graphics from './graphics.js'
import SoundPlayer from './audio.js'

export default class Tristris extends State {

  constructor(stateMachine) {

    super(stateMachine, config.input.contexts.game)
    this.addPushTransition('game/pause')

    const canvas = {
      'main': document.getElementsByClassName('main-canvas')[0],
      'next': document.getElementsByClassName('next-canvas')[0],
      'held': document.getElementsByClassName('held-canvas')[0],
    }
    const {grid: g, tileScale: scale} = config.graphics

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

    this.dispatcher = EventDispatcher.getInstance()
    this.observer = new EventObserver()
    this.observer.addHandler('game/togglePause', () => this.togglePause())
    this.observer.addHandler('arena/overflows', () => this.restartGame())
    this.observer.addHandler('player/scoreUpdated', () => this.displayScore())
    this.observer.registerHandlers(this.dispatcher)

    this.graphics = new Graphics(this)
    this.audio = new SoundPlayer(this)
    this.arena = new Arena(this)
    this.player = new Player(this)

    this.dispatcher.dispatch(new Event('game/started'))
  }

  update(dt = 0) {
    this.player.update(dt)
    this.arena.update()
  }

  draw() {
    const {canvas: c, context: ctx} = this
    ctx.main.clearRect(0, 0, c.main.width, c.main.height)
    this.player.draw()
    this.arena.draw()
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

}
