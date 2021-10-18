/*
  pause.js

  Author:  J. Tristan Bayfield
  Created: July 30, 2017
  License: GPLv3
*/

import config from '../assets/data/config.json'
import {State} from './state.js'

export default class Pause extends State {
  constructor(stateMachine) {
    super(stateMachine, config.input.contexts.pause)
    this.addPopTransition('game/unpause')
  }

  enter() {
    super.enter.call(this)
    this.dispatcher.dispatch(new Event('game/paused'))
  }

  exit() {
    super.exit.call(this)
    this.dispatcher.dispatch(new Event('game/unpaused'))
  }
}
