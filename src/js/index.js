import React from 'react';
import ReactDOM from 'react-dom';
// import player from './player';
import { AmrapContextProvider } from './contextProvider';
import AmrapTopPlayer from './amrapTopPlayer';
import { AmrapPopoutPortal, AmrapMiniPortal } from './amrapPortal';
import ErrorBoundary from './errorBoundary';
import Program from './Program';

const NewApp = () => {
  return (
    <ErrorBoundary>
      <AmrapContextProvider>
        <AmrapPopoutPortal>
          <AmrapTopPlayer liveUrls={window.liveUrls} hideShareButtons={'true'} />;
        </AmrapPopoutPortal>

        <AmrapMiniPortal>
          <Program audioFile={window.json.player.fm.browserReplayUrlTemplate} callSign={window.stationCallSign} />
        </AmrapMiniPortal>
      </AmrapContextProvider>
    </ErrorBoundary>
  );
};

function initPlayer () {
  ReactDOM.render(<NewApp />, document.getElementById('amrapRoot'));
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.json.player && Object.values(window.json.player).length > 0) {
    console.log('====================================');
    console.log(window.json.player.fm.browserReplayUrlTemplate);
    console.log('====================================');

    window.liveUrls = Object.values(window.json.player);
  } else {
    window.liveUrls = [];
  }
  initPlayer();
});
