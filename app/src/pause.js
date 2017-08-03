/*
  pause.js

  Author:  J. Tristan Bayfield
  Created: July 30, 2017
  License: GPLv3
*/

import config from './config.js'
import {State} from './state.js'

export default class Pause extends State {
  constructor(stateMachine) {
    super(stateMachine, config.input.contexts.pause)
    this.addPopTransition('game/unpause')
  }
}
