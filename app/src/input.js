/*
  input.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import config from './config.js'
import {EventDispatcher, EventObserver} from './event.js'

export class Input {

  constructor() {
    document.addEventListener('keydown', event => {
      this.handleKeyDown(event)
    })
    document.addEventListener('keyup', event => {
      this.handleKeyUp(event)
    })
  }

  handleKeyDown(event) { /* override in subclass */ }

  handleKeyUp(event)  { /* override in subclass */ }

}

export default class InputHandler extends Input {

  constructor(game) {
    super()
    this.game = game
    this.dispatcher = EventDispatcher.getInstance()
    this.contexts = config.input.contexts
    this.keyCodeEventMap = config.input.keyCodeEventMap
  }

  handleKeyDown(event) {
    if (event.keyCode in this.context) {
      this.dispatcher.dispatch(new Event(this.context[event.keyCode]))
    }
  }

  update() {
    // Use current game state to determine the inputs available to player
    this.context = this.contexts[this.game.state]
  }

}
