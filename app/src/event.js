/*
  observer.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

export class EventObserver {
  notify(event) {
    // Subclass must provide a dict of event handlers in the form:
    // this.eventHandlers = {
    //   evenType<string>: eventHanlder<function>
    // }
    if (event.type in this.eventHandlers)
      this.eventHandlers[event.type](event)
  }
}

export class EventDispatcher {

  constructor() {
    this.eventObservers = {};
  }

  subscribe(eventType, observer) {
    let eventObservers = this.eventObservers;
    if (eventType in eventObservers) {
      eventObservers[eventType].add(observer);
    } else {
      eventObservers[eventType] = new Set([observer]);
    }
  }

  subscribeAll(events, observer) {
    for (let event in events) {
      this.subscribe(event, observer);
    }
  }

  unsubscribe(eventType, observer) {
    if (eventType in this.eventObservers) {
      this.eventObservers[eventType].delete(observer);
    }
  }

  dispatch(event) {
    if (event.type in this.eventObservers) {
      this.eventObservers[event.type].forEach(
        observer => observer.notify(event)
      )
    }
  }
}
