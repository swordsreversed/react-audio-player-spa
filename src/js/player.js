// -------------------------------------------------------------
// Global object for storing playlists
// -------------------------------------------------------------

import { pickBy, sortBy, findIndex, clone } from 'lodash';
import uuidv4 from 'uuid/v4';
import 'whatwg-fetch';
import dayjs from 'dayjs';

let currentTrack = {};
let audioState = 'stopped';
let listeners = {};
let playlist = { tracks: [] };
let getStreamProgramInterval;
let volume = 1; // Float between 0 and 1.0
let onAirNowLookupUrl;

const playerID = uuidv4();

// TODO does this need to be a class?
class Player {
  constructor () {
    this.currentTrack = {};
    // window.addEventListener('message', (event) => {
    //   if (event.data && event.data.type === 'fbi-audio-player-event-child' && event.data.playerID !== playerID) {
    //     switch (event.data.message) {
    //       case 'set-playlist':
    //         this.setPlaylist(event.data.playlist);
    //         break;
    //       case 'set-current-track':
    //         // this.clearCurrentTrack();
    //         this.setCurrentTrack(
    //           event.data.data.id,
    //           event.data.data.url,
    //           event.data.data.title,
    //           event.data.data.artist,
    //           event.data.data.type,
    //           event.data.data.timeCode
    //         );
    //         break;
    //       case 'set-timecode':
    //         this.setTimeCode(event.data.timeCode);
    //         break;
    //       case 'play-stream':
    //         this.playStream(event.data.data.title, event.data.data.url, event.data.data.onAirNowUrl);
    //         break;
    //       case 'play-track':
    //         this.stopTrack();
    //         this.playTrack();
    //         break;
    //       case 'pause-track':
    //         this.pauseTrack();
    //         break;
    //       case 'stop-track':
    //         this.stopTrack();
    //         break;
    //       case 'next-track':
    //         this.nextTrack();
    //         break;
    //       case 'previous-track':
    //         this.previousTrack();
    //         break;
    //       case 'seek-seconds':
    //         this.seekSeconds(event.data.seconds);
    //         break;
    //       case 'seek-percentage':
    //         this.seekPercentage(event.data.percentage);
    //         break;
    //       case 'change-track-timecode':
    //         this.changeTrackTimeCode(event.data.newTimeCode);
    //         break;
    //       case 'new-bridge': // A new bridge player was registered in a child iframe, update it with details
    //         this.emitPlaylistUpdate();
    //         this.sendEventToListeners('handleSetCurrentTrack');
    //         break;
    //     }
    //   }
    // });
  }

  toSeconds (str) {
    let a = str.split(':');
    let seconds = +a[1] * 60 + +a[2];
    return seconds;
  }

  setVolume (volumeInt) {
    volume = volumeInt;
    if (currentTrack.audio) {
      // currentTrack.audio.volume = volume;
      currentTrack.audio.volume = 0.2;
    }
  }

  setPlaylist (playlistObject) {
    playlist = playlistObject;
    if (playlist.tracks) {
      playlist.tracks = sortBy(playlist.tracks, function (track) {
        return track.timeCode;
      });
    }
    this.emitPlaylistUpdate();
  }

  getPlaylist () {
    return playlist;
  }

  getCurrentTrack () {
    return this.currentTrack;
  }

  setCurrentTrack (id, url, title, artist, type, timeCode) {
    let rtc = timeCode ? this.toSeconds(timeCode) : null;
    console.log('rtc', rtc);
    console.log('tc', timeCode);

    currentTrack.id = id;
    currentTrack.url = url;
    currentTrack.title = title;
    currentTrack.artist = artist;
    currentTrack.type = type;
    currentTrack.timeCode = timeCode;
    currentTrack.clockTime = playlist.clockTime
      ? dayjs(playlist.clockTime).add(Math.floor(rtc), 'seconds').format('hh:mm:ss a')
      : timeCode;
    audioState = 'stopped';
    this.currentTrack = currentTrack;
  }

  clearCurrentTrack () {
    currentTrack = {};
    audioState = 'stopped';
  }

  setTimeCode (seconds) {
    if (currentTrack.audio) {
      currentTrack.audio.currentTime = seconds;
    }
  }

  playStream (title, url, onAirNowUrl) {
    this.stopTrack();
    setTimeout(() => {
      this.setCurrentTrack(url, url, 'Loading Stream...', null, 'stream');
      this.setPlaylist({ title, clockTime: dayjs().format('hh:mm:ss a'), tracks: [] });
      onAirNowLookupUrl = onAirNowUrl;
      this.playTrack();
    }, 200);
  }

  playTrack (timeCode) {
    // If we're listening to a stream, get the name of the program every minute
    if (getStreamProgramInterval) {
      clearInterval(getStreamProgramInterval);
    }
    if (audioState === 'paused' && currentTrack.audio) {
      currentTrack.audio.play();
      audioState = 'playing';
      // this.sendEventToListeners('handlePlay');
    } else {
      currentTrack.audio = new Audio();
      // Use Hls JS to decode and play .m3u8 playlists
      // NOTE: This relies on hls.js being included in a global context
      if (Hls && Hls.isSupported() && (currentTrack.url && currentTrack.url.indexOf('.m3u8') > 0)) {
        const hls = new Hls();
        hls.loadSource(currentTrack.url);
        hls.attachMedia(currentTrack.audio);
        currentTrack.audio.play();
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          this.emitUpdate('handlePlay');
        });
        hls.on(
          Hls.Events.ERROR,
          function (trackId, event, data) {
            if (currentTrack.id === trackId && audioState !== 'stopped' && data.fatal) {
              this.sendEventToListeners('handleError');
              console.log('Error while trying to load audio: ' + data.type + ' - ' + data.details);
            }
          }.bind(this, currentTrack.id)
        );
      } else {
        // play non hls audio
        currentTrack.audio.src = currentTrack.url;
        currentTrack.audio
          .play()
          .catch((error) => {
            this.sendEventToListeners('handleError');
            console.log('Error while trying to load audio: ' + error.message);
          })
          .then(() => {
            this.emitUpdate('handlePlay');
          });
      }

      // TODO change this!
      currentTrack.audio.volume = volume;
      audioState = 'loading';

      // Bind events to current audio
      currentTrack.audio.onplaying = () => {
        if (timeCode) {
          let tc = this.toSeconds(timeCode);
          this.seekSeconds(tc);
        }
        currentTrack.audio.onplaying = null;
      };

      currentTrack.audio.onloadedmetadata = () => {
        if (audioState === 'loading') {
          audioState = 'playing';
          this.sendEventToListeners('handlePlay');
          if (currentTrack.type === 'stream' && onAirNowLookupUrl) {
            const getStreamProgram = () => {
              fetch(onAirNowLookupUrl, {
                method: 'GET',
                crossOrigin: true
              })
                .then((data) => {
                  return data.json();
                })
                .then((json) => {
                  for (let i = 0; i < json.length; i++) {
                    if (json[i].onairnow === true) {
                      currentTrack.title =
                        json[i].name + (json[i].broadcasters ? ' with ' + json[i].broadcasters + ' ' : '');
                    }
                  }
                })
                .catch(function (data) {
                  console.log(data);
                });
            };
            getStreamProgram();
            getStreamProgramInterval = setInterval(() => {
              getStreamProgram();
            }, 60000);
          }
        }
      };

      currentTrack.audio.onpause = () => {
        audioState = 'paused';
      };

      currentTrack.audio.ontimeupdate = () => {
        if (audioState !== 'stopped') {
          // Update the track if we cross over into the next time code
          const index = findIndex(playlist.tracks, (track) => track.id === currentTrack.id);
          if (
            index !== -1 &&
            index < playlist.tracks.length - 1 &&
            currentTrack.audio.currentTime > playlist.tracks[index + 1].timeCode
          ) {
            const audio = currentTrack.audio;
            currentTrack = clone(playlist.tracks[index + 1]);
            currentTrack.audio = audio;
          }

          if (currentTrack) {
            if (currentTrack.type === 'stream') {
              currentTrack.clockTime = dayjs().format('hh:mm:ss a');
            } else if (playlist && playlist.clockTime) {
              currentTrack.clockTime = dayjs(playlist.clockTime)
                .add(Math.floor(currentTrack.audio.currentTime), 'seconds')
                .format('hh:mm:ss a');
            } else {
              currentTrack.clockTime = dayjs().format('hh:mm:ss a');
            }
          }
          this.emitUpdate('handleTimeUpdate');
        }
      };

      currentTrack.audio.onended = () => {
        if (audioState !== 'stopped') {
          this.nextTrack();
        }
      };

      currentTrack.audio.onerror = () => {
        this.sendEventToListeners('handleError');
        console.log('Error while trying to load audio: ' + currentTrack.audio.error.message);
      };

      // When listening to a live stream, the clock time is the current time in the users' timezone
      if (currentTrack.type === 'stream') {
        currentTrack.clockTime = dayjs().format('hh:mm:ss a');
      } else if (playlist && playlist.clockTime) {
        currentTrack.clockTime = dayjs(playlist.clockTime)
          .add(Math.floor(currentTrack.audio.currentTime), 'seconds')
          .format('hh:mm:ss a');
      }

      // this.sendEventToListeners('handleLoading');
    }
  }

  pauseTrack () {
    if (currentTrack.audio) {
      currentTrack.audio.pause();
      if (currentTrack.type === 'stream') {
        this.stopTrack();
      } else {
        this.sendEventToListeners('handlePause');
      }
    }
  }

  stopTrack () {
    if (currentTrack.audio && audioState !== 'stopped') {
      currentTrack.audio.pause();
      audioState = 'stopped';
      this.sendEventToListeners('handleStop');
    }
  }

  // Returns true if there is a "next" track queued after this one
  nextTrackAvailable () {
    if (playlist.tracks && currentTrack) {
      const index = findIndex(playlist.tracks, (track) => track.id === currentTrack.id);
      if (index < playlist.tracks.length - 1) {
        return true;
      }
    } else {
      return false;
    }
  }

  // Returns true if there is a "previous" track queued before this one
  previousTrackAvailable () {
    if (currentTrack && currentTrack.type === 'stream') {
      return false;
    } else if (playlist.tracks && currentTrack) {
      return true;
    }
    return false;
  }

  nextTrack () {
    // Find the current track in the playlist
    if (playlist && currentTrack) {
      const index = findIndex(playlist.tracks, (track) => track.id === currentTrack.id);
      if (index < playlist.tracks.length - 1) {
        // If the next track is a timecode within the same file
        if (playlist.tracks[index + 1].url === currentTrack.url) {
          this.setTimeCode(playlist.tracks[index + 1].timeCode);
          const audio = currentTrack.audio;
          currentTrack = clone(playlist.tracks[index + 1]);
          currentTrack.audio = audio;
          if (audioState === 'paused') {
            this.playTrack();
          } else {
            this.sendEventToListeners('handlePlay');
          }
        } else {
          // Otherwise if it's a new file
          this.stopTrack();
          currentTrack = clone(playlist.tracks[index + 1]);
          this.playTrack();
        }

        this.sendEventToListeners('handleSetCurrentTrack');
      }
    }
  }

  previousTrack () {
    // Find the current track in the playlist
    if (playlist && currentTrack) {
      const index = findIndex(playlist.tracks, (track) => track.id === currentTrack.id);

      if (index > 0) {
        // If the previous track is a timecode within the same file
        if (playlist.tracks[index - 1].url === currentTrack.url) {
          this.setTimeCode(playlist.tracks[index - 1].timeCode);
          const audio = currentTrack.audio;
          currentTrack = clone(playlist.tracks[index - 1]);
          currentTrack.audio = audio;
          if (audioState === 'paused') {
            this.playTrack();
          } else {
            this.sendEventToListeners('handlePlay');
          }
        } else {
          // Otherwise if it's a new file
          this.stopTrack();
          currentTrack = clone(playlist.tracks[index - 1]);
          this.playTrack();
        }

        this.sendEventToListeners('handleSetCurrentTrack');
      } else if (index === 0) {
        // If the playlist.tracks is one long track with timecodes
        this.setTimeCode(playlist.tracks[0].timeCode);
      }
    }
  }

  // Seek to a percentage through a track
  seekPercentage (percentage) {
    if (currentTrack.audio) {
      const seconds = currentTrack.audio.duration * (percentage / 100);
      this.setTimeCode(seconds);

      if (currentTrack.timeCode || currentTrack.timeCode === 0) {
        let index = findIndex(playlist.tracks, (track) => seconds < track.timeCode);

        if (index === -1) {
          index = playlist.tracks.length - 1;
        } else if (index !== 0) {
          index--;
        }

        const audio = currentTrack.audio;
        currentTrack = playlist.tracks[index];
        currentTrack.audio = audio;
        if (audioState === 'paused') {
          this.playTrack();
        }
        this.sendEventToListeners('handlePlay');
      }
    }
  }

  // Seek to seconds through a track
  seekSeconds (seconds) {
    if (currentTrack.audio) {
      this.setTimeCode(seconds);

      if (currentTrack.timeCode || currentTrack.timeCode === 0) {
        let index = findIndex(playlist.tracks, (track) => seconds < track.timeCode);

        if (index === -1) {
          index = playlist.tracks.length - 1;
        } else if (index > 0) {
          index--;
        }

        // TODO commenting this out fixed ontimeupdate - ???
        // const audio = currentTrack.audio;
        // currentTrack = playlist.tracks[index];
        // currentTrack.audio = audio;
        if (audioState === 'paused') {
          this.playTrack();
        }
        this.emitUpdate('handlePlay');
      }
    }
  }

  // Alters the timecode of the current track (used for edit mode)
  changeTrackTime (newTimeCode) {
    if (currentTrack) {
      currentTrack.timeCode = newTimeCode;
      const index = findIndex(playlist.tracks, (track) => track.id === currentTrack.id);
      if (index > 0) {
        playlist.tracks[index].timeCode = newTimeCode;
      }
      this.emitPlaylistUpdate();
      this.sendEventToListeners('handleChangeTrackTimeCode');
    } else {
      console.log('React Audio Player: changeTrackTime failed because there is no current track set.');
    }
  }

  addListener (key, listener) {
    listeners[key] = listener;
  }

  removeListener (key) {
    delete listeners[key];
  }

  emitPlaylistUpdate () {
    const clonedPlaylist = pickBy(playlist, (key) => key !== 'tracks');
    clonedPlaylist.tracks = playlist.tracks.map((t) => {
      return {
        audio: t.audio
          ? {
              currentTime: t.audio.currentTime,
              duration: t.audio.duration,
              error: t.audio.error && t.audio.error.message
            }
          : null,
        id: t.id,
        url: t.url,
        title: t.title,
        artist: t.artist,
        type: t.type,
        timeCode: t.timeCode,
        clockTime: t.clockTime
      };
    });
    const amrapFrames = document.getElementsByClassName('amrappagesFrame');
    for (let i = 0; i < amrapFrames.length; i++) {
      const currentFrame = amrapFrames[i];
      currentFrame.contentWindow.postMessage(
        {
          type: 'fbi-audio-player-event-parent',
          message: 'set-playlist',
          playerID: playerID,
          playlist: clonedPlaylist
        },
        '*'
      );
    }
  }

  emitUpdate (event) {
    let playerInfo = {
      message: event,
      event: event,
      playerID: playerID,
      data: {
        audio: currentTrack.audio
          ? {
              currentTime: currentTrack.audio.currentTime,
              duration: currentTrack.audio.duration,
              error: currentTrack.audio.error && currentTrack.audio.error.message
            }
          : null,
        id: currentTrack.id,
        url: currentTrack.url,
        title: currentTrack.title,
        artist: currentTrack.artist,
        type: currentTrack.type,
        timeCode: currentTrack.timeCode,
        clockTime: currentTrack.clockTime
      }
    };
    document.body.dispatchEvent(new CustomEvent('update', { detail: playerInfo, bubbles: true }));
  }

  sendEventToListeners (event) {
    for (let key in listeners) {
      if (listeners[key][event]) {
        listeners[key][event](currentTrack);
      }
    }

    const amrapFrames = document.getElementsByClassName('amrappagesFrame');
    for (let i = 0; i < amrapFrames.length; i++) {
      const currentFrame = amrapFrames[i];
      currentFrame.contentWindow.postMessage(
        {
          type: 'fbi-audio-player-event-parent',
          message: 'dispatch-event',
          event: event,
          playerID: playerID,
          data: {
            audio: currentTrack.audio
              ? {
                  currentTime: currentTrack.audio.currentTime,
                  duration: currentTrack.audio.duration,
                  error: currentTrack.audio.error && currentTrack.audio.error.message
                }
              : null,
            id: currentTrack.id,
            url: currentTrack.url,
            title: currentTrack.title,
            artist: currentTrack.artist,
            type: currentTrack.type,
            timeCode: currentTrack.timeCode,
            clockTime: currentTrack.clockTime
          }
        },
        '*'
      );
    }
  }
}

export default Player;
