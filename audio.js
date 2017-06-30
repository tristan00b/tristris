/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

class SoundPlayer extends EventObserver {

  constructor(data) {

    super();

    this.data = data

    this.sfx = [
      new Audio(data.sound.sfxPath + '/ticktock.wav'), // on rotate
      new Audio(data.sound.sfxPath + '/blip.wav')      // on lines cleared
    ]

    this.bgMusic = new Audio()
    this.bgMusic.onended = () => this.playNextTrack()

    this.eventHandlers = {
      'tetris/arena/rowsCleared': () => this.sfx[0].cloneNode().play(),
      'tetris/player/rotated': () => this.sfx[1].cloneNode().play(),
      'tetris/game/started': () => this.playNextTrack(),
      'tetris/game/paused': () => this.stopMusic(),
      'tetris/game/unpaused': () => this.startMusic(),
      'tetris/sound/toggleMusic': () => this.toggleMusic(),
    }

    data.eventDispatcher.subscribeAll(this.eventHandlers, this)
  }

  playNextTrack() {
    // Choose a random track to play, then play it
    const trackNo = (Math.random()*this.data.sound.numTracks|0) + 1;
    const file = String(trackNo).padStart(2, '0') + '.mp3';
    console.log('playing: ' + file);
    this.bgMusic.src = this.data.sound.musPath + '/' + file;
    this.bgMusic.play();
  }

  startMusic() {
    this.bgMusic.play()
  }

  stopMusic() {
    this.bgMusic.pause()
  }

  toggleMusic() {
    (this.data.bgMusicMuted = !this.data.bgMusicMuted) ?
      this.bgMusic.pause() : this.bgMusic.play()
  }
}
