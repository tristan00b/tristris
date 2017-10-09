/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

import config from './config.js'
import { EventDispatcher, EventObserver } from './event.js'

export default class SoundPlayer {

  constructor(game) {
    this.muted   = config.debug === true
    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    this.dispatcher = EventDispatcher.getInstance()
    this.observer   = new EventObserver()
    this.observer.addHandler('game/started',      () => this.playNextTrack())
    this.observer.addHandler('game/stopped',      () => this.stopMusic())
    this.observer.addHandler('game/pause',        () => this.stopMusic())
    this.observer.addHandler('game/unpause',      () => this.startMusic())
    this.observer.addHandler('audio/toggleMusic', () => this.toggleMusic())
    this.observer.addHandler('audio/skipSong',    () => this.playNextTrack())

    const { eventEffectMap } = config.sound
    Object.keys(eventEffectMap).forEach(event => {
      const effect = new Audio(eventEffectMap[event])
      this.observer.addHandler(event, () => this.playSound(effect))
    })

    this.observer.registerHandlers(this.dispatcher)
  }

  playSound(sound) {
    sound.cloneNode().play();
  }

  playNextTrack() {
    const tracks     = config.sound.tracks
    const numTracks  = tracks.length
    const trackNo    = (Math.random() * numTracks) | 0

    this.bgMusic.src = tracks[trackNo]
    this.startMusic()
  }

  startMusic() {
    if (false == this.muted) this.bgMusic.play()
  }

  stopMusic() {
    this.bgMusic.pause()
  }

  toggleMusic() {
    (this.muted = !this.muted) ? this.bgMusic.pause() : this.bgMusic.play()
  }

}
