/*
  input.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

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

  constructor({ scope, consumesEvents }) {
    super()

    this._isListening   = false
    this.consumesEvents = consumesEvents || false
    this.scope          = scope
    this.dispatcher     = EventDispatcher.getInstance()
  }

  get isListening() {
    return this._isListening
  }

  startListening() {
    this._isListening = true
  }

  stopListening() {
    this._isListening = false
  }

  canConsume(event) {
    return !event.consumed
  }

  canProcess(event) {
    return this.isListening && (event.keyCode in this.scope)
  }

  consumeIfRequired(event) {
    if (this.consumesEvents) event.consumed = true
  }

  handleKeyDown(event) {
    if (this.canConsume(event) && this.canProcess(event)) {
      this.consumeIfRequired(event)
      this.dispatcher.dispatch(new Event(this.scope[event.keyCode]))
    }
  }

}
