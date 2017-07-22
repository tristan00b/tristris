/*
  event.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

export class EventObserver {

  constructor () {
    this.handlers = {}
  }

  addHandler(eventType, handler) {
    this.handlers[eventType] = handler
  }

  notify(event) {
    if (event.type in this.handlers) {
      this.handlers[event.type](event)
    }
  }

  registerHandlers(dispatcher) {
    dispatcher.subscribeAll(this, Object.keys(this.handlers))
  }

}

export class EventDispatcher {

  constructor() {
    this.observers = {}
  }

  subscribe(eventType, observer) {
    if (eventType in this.observers) {
      this.observers[eventType].add(observer)
    } else {
      this.observers[eventType] = new Set([observer])
    }
  }

  subscribeAll(observer, events) {
    events.forEach(event => this.subscribe(event, observer)
    )
  }

  unsubscribe(observer, eventType) {
    if (eventType in this.observers) {
      this.observers[eventType].delete(observer)
    }
  }

  dispatch(event) {
    if (event.type in this.observers) {
      this.observers[event.type].forEach(observer => observer.notify(event))
    }
  }

}
