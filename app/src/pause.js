/*
  pause.js

  Author:  J. Tristan Bayfield
  Created: July 30, 2017
  License: GPLv3
*/

import {State} from './state.js'

export default class Pause extends State {
  constructor(game, stateMachine) {
    super(stateMachine, game.config, game.config.input.scopes.pause)
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
