/*
  audio.js

  Author:  J. Tristan Bayfield
  Created: June 27, 2017
  License: GPLv3
*/

const sfxPath = 'assets/audio/effects';
const musPath = 'assets/audio/soundtrack';
const numTracks = 13;

class SoundPlayer extends EventObserver {

  constructor(dispatcher) {

    super();

    const sfx = [
      new Audio(sfxPath + '/ticktock.wav'), // on rotate
      new Audio(sfxPath + '/blip.wav')      // on lines cleared
    ];

    this.eventHandlers = {
      'tetris/linesCleared': (event) => {
        sfx[0].cloneNode().play()
      },
      'tetris/playerRotated': (event) => {
        sfx[1].cloneNode().play()
      },
      'tetris/toggleMusic': (event) => {
        this.toggleMusic();
      }
    }

    for (let event in this.eventHandlers) {
      dispatcher.subscribe(event, this);
    }

    this.soundtrack = new Audio();
    this.soundtrack.onended = () => this.playNextTrack();
    this.playNextTrack();
  }

  playNextTrack() {
    // Choose a random track to play, then play it
    const trackNo = (Math.random()*numTracks|0) + 1;
    const file = String(trackNo).padStart(2, '0') + '.mp3';
    console.log('playing: ' + file);
    this.soundtrack.src = musPath + '/' + file;
    this.soundtrack.play();
  }

  toggleMusic() {
    if (this.soundtrack.paused) {
      this.soundtrack.play();
    } else {
      this.soundtrack.pause()
    }
  }
}
