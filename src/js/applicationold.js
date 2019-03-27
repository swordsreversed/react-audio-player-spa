// -------------------------------------------------------------
// This file includes all the necessary dom bindings and initialization to
// run the FBi audio player on the FBi website.
// -------------------------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom';
import Player from './player.js';
import AmrapPopoutPlayer from './amrap-popout-player.js';
// import AmrapMobilePlayer from './amrap-mobile-player.js';
// import MiniPlayerWithScrub from './mini-player-with-scrub.jsx';
// import MiniPlayer from './mini-player.jsx';
// import MiniPlayerStandalone from './mini-player-standalone.jsx';
import dayjs from 'dayjs';
import { objectValues } from 'lodash';

if (process.env.NODE_ENV === 'development') {
  setTimeout(function () {
    require('preact/devtools');
  }, 2000);
}

window.rebindAudioPlayers = function () {
  if (window.showReactAudioPlayer) {
    window.addEventListener('DOMContentLoaded', (event) => {
      console.log('DOM fully loaded and parsed');

      // const playlists = document.querySelectorAll('.trackList table');
      // Construct playlists when they have the same 'audio-id'

      var playlists = document.querySelectorAll('.trackList table');
      if (playlists) {
        console.log('====================================');
        console.log('playlist!', playlists.length);
        console.log('====================================');

        // start react code
        playlists.forEach(function (item) {
          console.log('pl', item);
        });
        const playlistObjects = [];
        let autoPlay;
        for (let i = 0; i < playlists.length; i++) {
          if (!playlists[i].getAttribute('data-audio-url')) {
            console.log('====================================');
            console.log('no data audio url');
            console.log('====================================');
            break;
          }
          if (!playlistObjects[i]) {
            playlistObjects[i] = {
              title: playlists[i].getAttribute('data-playlist'),
              clockTime: playlists[i].getAttribute('data-starttime'),
              endTime: playlists[i].getAttribute('data-endtime'),
              tracks: []
            };
          }

          const children = playlists[i].querySelectorAll('.playlist-track');
          console.log('====================================');
          console.log('children', playlists[i].querySelectorAll('.playlist-track').length);
          console.log('====================================');
          for (let j = 0; j < children.length; j++) {
            if (children[j].getAttribute('data-timecode')) {
              const playlistObject = {
                id: children[j].id,
                title: children[j].getAttribute('data-title'),
                artist: children[j].getAttribute('data-artist'),
                timeCode: parseInt(
                  dayjs
                    .duration(
                      dayjs(children[j].getAttribute('data-timecode')).diff(dayjs(playlistObjects[i].clockTime))
                    )
                    .asSeconds(),
                  10
                ),
                url: playlists[i].getAttribute('data-audio-url'),
                type: 'ondemand'
              };

              if (children[j].getAttribute('data-time')) {
                playlistObject.timeCode = parseInt(children[j].getAttribute('data-time'), 10);
              }

              playlistObjects[i].tracks.push(playlistObject);

              // let miniPlayer;

              // if (children[j].getAttribute('data-show-scrub-buttons') === 'true') {
              //   miniPlayer = (
              //     <MiniPlayerWithScrub
              //       id={playlistObject.id}
              //       url={playlistObject.url}
              //       title={playlistObject.title}
              //       artist={playlistObject.artist}
              //       type={'ondemand'}
              //       timeCode={playlistObject.timeCode}
              //       loading={false}
              //       playlist={playlistObjects[i]}
              //     />
              //   );
              // } else {
              //   miniPlayer = (
              //     <MiniPlayer
              //       id={playlistObject.id}
              //       url={playlistObject.url}
              //       title={playlistObject.title}
              //       artist={playlistObject.artist}
              //       type={'ondemand'}
              //       timeCode={playlistObject.timeCode}
              //       loading={false}
              //       playlist={playlistObjects[i]}
              //     />
              //   );
              // }

              // function try_appendChild (attempt) {
              //   /* Poll until the position exists.  Give up after 60 secs */
              //   if (children[j].querySelector('.play-button') === 0) {
              //     if (attempt < 600) {
              //       setTimeout(function () {
              //         console.log('====================================');
              //         console.log('attempt', attempt);
              //         console.log('====================================');
              //         try_appendChild(attempt + 1);
              //       }, 100);
              //     }
              //     return 'done';
              //   } else {
              //     if ($('#amrap-player iframe').length === 0) {
              //       console.log('====================================');
              //       console.log('adding react miniplayer');
              //       console.log('====================================');
              //       ReactDOM.render(miniPlayer, children[j].querySelector('.play-button'));
              //     }
              //     return 'head';
              //   }
              // }
              // try_appendChild(0);
              if (children[j].querySelector('.play-button')) {
                //   console.log('====================================');
                //   console.log('render track play button');
                //   console.log('====================================');
                // ReactDOM.render(miniPlayer, children[j].querySelector('.play-button'));
              } else {
                console.log(
                  'Audio Player error: No element with class "play-button" was found inside this .fbi-audio-list-item'
                );
              }

              if (children[j].getAttribute('data-autoplay')) {
                autoPlay = playlistObject;
              }
            }
          }

          // Add the first timecode at 0:00
          playlistObjects[i].tracks.splice(0, 0, {
            title: playlists[i].getAttribute('data-playlist'),
            timeCode: 0,
            id: playlists[i].getAttribute('data-playlist') + '-0',
            url: playlists[i].getAttribute('data-audio-url'),
            type: 'ondemand'
          });
        }

        if (playlistObjects.length > 0) {
          // removed to stop playlist being loaded on page loads
          // useful for SPAs
          // TODO add flag for spa vs normal page?
          // march 19
          // bridgePlayer.setPlaylist(playlistObjects[0]);
          // if (!bridgePlayer.getCurrentTrack().title) {
          //   if (autoPlay) {
          //     bridgePlayer.setCurrentTrack(
          //       autoPlay.id,
          //       autoPlay.url,
          //       autoPlay.title,
          //       autoPlay.artist,
          //       'ondemand',
          //       autoPlay.timeCode
          //     );
          //     bridgePlayer.playTrack();
          //   } else {
          //     bridgePlayer.setCurrentTrack(
          //       playlistObjects[0].tracks[0].id,
          //       playlistObjects[0].tracks[0].url,
          //       playlistObjects[0].tracks[0].title,
          //       playlistObjects[0].tracks[0].artist,
          //       'ondemand',
          //       playlistObjects[0].tracks[0].timeCode
          //     );
          //   }
          // }
        }

        // Grab any individual audio items not in a playlist - move out of playlist check
        // const playerItems = document.getElementsByClassName('amrap-audio-item');
        // for (let i = 0; i < playerItems.length; i++) {
        //   if (playerItems[i].getAttribute('data-audio-url') || playerItems[i].getAttribute('data-loading')) {
        //     const miniPlayer = (
        //       <MiniPlayerStandalone
        //         url={playerItems[i].getAttribute('data-audio-url')}
        //         title={playerItems[i].getAttribute('data-title')}
        //         type={playerItems[i].getAttribute('data-type')}
        //         loading={playerItems[i].getAttribute('data-loading') === 'true'}
        //         timeCode={
        //           playerItems[i].getAttribute('data-timecode') &&
        //           parseInt(playerItems[i].getAttribute('data-timecode'), 10)
        //         }
        //       />
        //     );
        //     if (playerItems[i].querySelector('.play-button')) {
        //       ReactDOM.render(miniPlayer, playerItems[i].querySelector('.play-button'));
        //     } else {
        //       console.log(
        //         'FBI Audio Player error: No element with class "play-button" was found inside this .fbi-audio-list-item'
        //       );
        //     }
        //   }
        // }
      } // end if playlist

      if (window.json.player && objectValues(window.json.player).length > 0) {
        window.liveUrls = objectValues(window.json.player);
      } else {
        window.liveUrls = [];
      }

      if (document.getElementById('amrapPlayer') || document.getElementById('amrap-player')) {
        if (/Mobi/.test(navigator.userAgent)) {
          // const topPlayer = ReactDOM.render(
          //   <AmrapMobilePlayer liveUrls={window.liveUrls} />,
          //   document.getElementById('amrapPlayer')
          // );
        } else {
          const topPlayer = ReactDOM.render(
            <AmrapPopoutPlayer liveUrls={window.liveUrls} hideShareButtons={'true'} />,
            document.getElementById('amrapPlayer')
          );
        }
      }
    }); // end domcontent
  } // end if
};

document.addEventListener('DOMContentLoaded', function (event) {
  // ReactDOM.render(<Demo />, document.getElementById('app'));
  // window.rebindAudioPlayers();
});

window.reactPlayer = new Player();
