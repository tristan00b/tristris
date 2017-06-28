/*
  observer.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

class EventObserver {
  notify(event) {
    if (event.type in this.eventHandlers) {
      let handler = this.eventHandlers[event.type];
      handler(event);
    }
  }
}

class EventDispatcher {

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

  unsubscribe(eventType, observer) {
    if (eventType in this.eventObservers) {
      this.eventObservers[eventType].delete(observer);
    }
  }

  dispatch(event) {
    if (event.type in this.eventObservers) {
      this.eventObservers[event.type].forEach((observer) => {
        observer.notify(event);
      });
    }
  }
}
