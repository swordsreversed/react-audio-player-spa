import React from 'react';
import ReactDOM from 'react-dom';
// import player from './player';
import { AmrapContextProvider } from './contextProvider';
import AmrapPopoutPlayer from './amrap-popout-player';
import { AmrapPopoutPortal, AmrapMiniPortal } from './amrapPortal';
import ErrorBoundary from './errorBoundary';
import Program from './Program';

const NewApp = () => {
  return (
    <ErrorBoundary>
      <AmrapContextProvider>
        <AmrapPopoutPortal>
          <AmrapPopoutPlayer liveUrls={window.liveUrls} hideShareButtons={'true'} />;
        </AmrapPopoutPortal>

        <AmrapMiniPortal>
          <Program audioFile={window.json.player.fm.browserReplayUrlTemplate} callSign={window.stationCallSign} />
        </AmrapMiniPortal>
      </AmrapContextProvider>
    </ErrorBoundary>
  );
};

function initPlayer () {
  if (window.showReactAudioPlayer === true) {
    ReactDOM.render(<NewApp />, document.getElementById('amrapRoot'));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.json.player && Object.values(window.json.player).length > 0) {
    window.liveUrls = Object.values(window.json.player);
  } else {
    window.liveUrls = [];
  }
  initPlayer();
});
