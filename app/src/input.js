/*
  input.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import {EventDispatcher, EventObserver} from './event.js'

export class Input {

  constructor(config) {

    this.config = config

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

  constructor(config, state, options = {}) {
    super(config)
    this.consumesEvents = options.consumeEvents || false
    this.context = state.context
    this.contexts = config.input.contexts
    this.dispatcher = EventDispatcher.getInstance()
    this.machine = state.machine
    this.state = state
  }

  canConsume(event) {
    return !event.consumed
  }

  canProcess(event) {
    return (this.state === this.machine.state)
        && (event.keyCode in this.context)
  }

  consumeIfRequired(event) {
    if (this.consumesEvents) event.consumed = true
  }

  handleKeyDown(event) {
    if (this.canConsume(event) && this.canProcess(event)) {
      this.consumeIfRequired(event)
      this.dispatcher.dispatch(new Event(this.context[event.keyCode]))
    }
  }

}
