/*
  fsm.js

  Author:  J. Tristan Bayfield
  Created: July 22, 2017
  License: GPLv3
*/

import {EventDispatcher, EventObserver} from './event.js'
import InputHander from './input.js'

class Transition {
  constructor(event, source, target) {
    this.event = event
    this.source = source
    this.target = target
  }
}

export class State {

  constructor(stateMachine, inputContext) {
    this.machine = stateMachine
    this.context = inputContext || {}
    this.input = new InputHander(this, {consumeEvents: true})
    this.dispatcher = EventDispatcher.getInstance();
    this.observer = new EventObserver()
  }

  _addTransition(transition, handler) {
    this.observer.addHandler(transition, () =>
      handler.call(this.machine, transition))
    this.dispatcher.subscribe(transition, this.observer)
  }

  addChangeTransition(transition) {
    this._addTransition(transition, this.machine.changeState)
  }

  addPushTransition(transition) {
    this._addTransition(transition, this.machine.pushState)
  }

  addPopTransition(transition) {
    this._addTransition(transition, this.machine.popState)
  }

  enter()    { /* Overridden by subclass */ }
  exit()     { /* Overridden by subclass */ }
  update(dt) { /* Overridden by subclass */ }
  draw()     { /* Overridden by subclass */ }
}

export class StateMachine {

  constructor(options = {}) {

    // assign option defaults
    const defaults = {
      initialState: options.initialState || 'default',
      states: (options.states || { 'default': State }),
      transitions: (options.transitions || [])
    }

    // prepare states dict
    const states = Object.entries(defaults.states).reduce((states, state) => {
      const [name, ctor] = state
      states[name] = new ctor(this)
      return states
    }, {})
    states.initialState = states[defaults.initialState]

    // prepare transitions dict
    const transitions = defaults.transitions.reduce((transitions, triplet) => {
      const [event, source, target] = triplet
      transitions[event] = new Transition(event, states[source], states[target])
      return transitions
    }, {})

    // init this
    Object.assign(this, defaults, {states, transitions, _state: []})
    this._push(states.initialState)
  }

  get state() {
    return this._state[this._state.length - 1]
  }

  _push(state) {
    this._state.push(state)
    this.state.enter()
  }

  _pop() {
    this.state.exit()
    return this._state.pop()
  }

  changeState(transition) {
    if (transition in this.transitions) {
      this._pop()
      this._push(this.transitions[transition].target)
    }
  }

  pushState(transition) {
    if (transition in this.transitions) {
      this._push(this.transitions[transition].target)
    }
  }

  popState() {
    this._pop()
    this.state && this.state.enter()
  }
}
