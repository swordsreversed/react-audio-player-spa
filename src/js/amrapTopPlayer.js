// -------------------------------------------------------------
// AMRAP audio player for popout window
// -------------------------------------------------------------

import React from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import { unescape } from 'lodash';
import Player from './player';
import AmrapContext from './contextProvider';
import { format } from 'path';
const bridgePlayer = new Player();

export default class PlayerView extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      trackId: null,
      trackUrl: null,
      audioState: 'stopped',
      currentAudio: null,
      currentPlaylist: {},
      trackTime: 0,
      trackTitle: unescape(bridgePlayer.getPlaylist().title) || 'Click play to listen',
      volume: 100,
      volumeBarVisible: false,
      hoverTimeVisible: false,
      hoverTimeX: 0,
      hoverTimeContent: '',
      error: false,
      clockTime: dayjs(bridgePlayer.getPlaylist().clockTime).format('hh:mm:ss a')
    };
  }

  startSeekLeft () {
    this.seekToken = setInterval(() => {
      bridgePlayer.seekSeconds(this.state.trackTime - 1);
    }, 250);
  }

  startSeekRight () {
    this.seekToken = setInterval(() => {
      bridgePlayer.seekSeconds(this.state.trackTime + 1);
    }, 250);
  }

  endSeek () {
    clearInterval(this.seekToken);
  }

  handleSetCurrentTrack (data) {
    this.setState({
      trackId: data.id,
      trackUrl: data.url,
      trackTitle: unescape(data.title),
      trackArtist: data.artist,
      trackTime: Math.floor(data.audio && data.audio.currentTime) || data.timeCode || 0,
      clockTime: data.clockTime
    });

    bridgePlayer.setCurrentTrack(data.id, data.url, data.title, data.artist, 'type', data.timeCode);
    // bridgePlayer.setCurrentTrack(
    //   this.state.trackId,
    //   this.state.trackUrl,
    //   this.state.trackTitle,
    //   this.state.trackArtist,
    //   'type',
    //   this.state.timeCode
    // );
  }

  handleChangeTrackTimeCode (data) {
    this.setState({
      audioState: 'playing',
      trackTitle: unescape(data.title),
      trackArtist: data.artist,
      trackLength: data.audio.duration || this.state.trackLength,
      trackTime: Math.floor(data.audio.currentTime) || data.timeCode || this.state.trackTime,
      clockTime: data.clockTime
    });
  }

  handlePlay (data) {
    if (typeof data.audio === 'undefined') {
      data.audio = {};
      data.audio.currentTime = null;
      data.audio.duration = null;
    }
    // if (typeof data.audio.duration === 'undefined') {
    //   data.audio.duration = null;
    // }
    this.setState({
      audioState: 'playing',
      // trackTitle: unescape(data.title),
      // trackArtist: data.artist,
      // trackLength: data.audio.duration || this.state.trackLength,
      trackTime: Math.floor(data.audio.currentTime) || data.timeCode || this.state.trackTime,
      clockTime: data.clockTime
    });
    this.context.updatePlayer('playing');
  }

  handlePause (data) {
    this.setState({
      audioState: 'paused'
    });
  }

  handleStop () {
    this.setState({
      audioState: 'stopped',
      trackTime: 0
    });
  }

  handleLoadingOld (data) {
    this.setState({
      audioState: 'loading',
      trackTitle: unescape(data.title),
      trackArtist: data.artist,
      clockTime: data.clockTime
    });
  }

  handleLoading (data) {
    this.setState({
      audioState: 'loading'
    });
  }

  handleTimeUpdate (playerInfo) {
    let ctup = dayjs(playerInfo.data.clockTime)
      .add(Math.floor(playerInfo.data.audio.currentTime), 'seconds')
      .format('hh:mm:ss a');
    this.setState({
      // trackTime: playerInfo.data.audio.currentTime
      //   ? Math.floor(playerInfo.data.audio.currentTime)
      //   : this.state.trackTime,
      trackTime: playerInfo.data.audio.currentTime,
      trackLength: playerInfo.data.audio.duration || this.state.trackLength,
      trackTitle: unescape(playerInfo.data.title),
      trackArtist: playerInfo.data.artist,
      clockTime: ctup
    });
  }

  handleError (data) {
    this.setState({
      audioState: 'error'
    });
  }

  playClicked (timeCode = null) {
    if (this.state.audioState !== 'playing') {
      if (
        bridgePlayer.getPlaylist().tracks.length === 0 &&
        !bridgePlayer.getCurrentTrack().url &&
        this.props.liveUrls.length > 0 &&
        !timeCode
      ) {
        this.playStream(this.props.liveUrls[0]);
      } else {
        bridgePlayer.playTrack();
      }
    }
  }

  // temp method for testing
  // TODO playlists
  playClickedMini (timeCode) {
    bridgePlayer.playTrack(timeCode);
  }

  pauseClicked () {
    bridgePlayer.pauseTrack();
  }

  nextTrackClicked () {
    bridgePlayer.nextTrack();
  }

  previousTrackClicked () {
    bridgePlayer.previousTrack();
  }

  barClick (event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const percent =
      (mouseX - ReactDOM.findDOMNode(this.refs.bar).getBoundingClientRect().left) /
      ReactDOM.findDOMNode(this.refs.bar).offsetWidth;
    if (bridgePlayer.getCurrentTrack().type !== 'stream') {
      this.setState({
        trackTime: this.state.trackLength * percent
      });
      bridgePlayer.seekPercentage(percent * 100);
    }
  }

  barMouseLeave (event) {
    this.setState({
      hoverTimeVisible: false
    });
  }

  barMouseMove (event) {
    let trackLength;
    if (this.state.trackLength) {
      trackLength = this.state.trackLength;
    } else if (bridgePlayer.getPlaylist().endTime) {
      trackLength = dayjs
        .duration(dayjs(bridgePlayer.getPlaylist().endTime).diff(dayjs(bridgePlayer.getPlaylist().clockTime)))
        .asSeconds();
    } else {
      return;
    }

    const mouseX = event.clientX;
    const percent =
      (mouseX - ReactDOM.findDOMNode(this.refs.bar).getBoundingClientRect().left) /
      ReactDOM.findDOMNode(this.refs.bar).offsetWidth;
    const totalTimeSeconds = trackLength * percent;
    const totalTime = dayjs(bridgePlayer.getPlaylist().clockTime).add(totalTimeSeconds, 'seconds').format('hh:mm:ss a');
    this.setState({
      hoverTimeVisible: true,
      hoverTimeX: event.nativeEvent.offsetX,
      hoverTimeContent: totalTime
    });
  }

  playStream (streamInfo) {
    // if (unescape(bridgePlayer.getPlaylist().title)) {
    //   this.setState({
    //     previousPlaylist: bridgePlayer.getPlaylist()
    //   });
    // }
    bridgePlayer.playStream(
      streamInfo.guideName,
      streamInfo.browserLiveStreamUrl,
      'http://airnet.org.au/rest/stations/' + window.stationCallSign + '/guides/' + streamInfo.guideId
    );
    this.setState({
      audioState: 'playing'
    });
  }

  backToPreviousPlaylist () {
    if (!this.state.previousPlaylist) {
      return;
    }
    bridgePlayer.stopTrack();
    setTimeout(() => {
      let firstTrack = this.state.previousPlaylist.tracks[0];
      bridgePlayer.setPlaylist(this.state.previousPlaylist);
      bridgePlayer.setCurrentTrack(
        firstTrack.id,
        firstTrack.url,
        firstTrack.title,
        firstTrack.artist,
        'ondemand',
        firstTrack.timeCode
      );
      bridgePlayer.playTrack();
    }, 200);
  }

  componentDidMount () {
    document.body.addEventListener('update', (e) => {
      switch (e.detail.event) {
        case 'handleLoading':
          this.handleLoading(e.detail);
          break;

        case 'handlePlay':
          this.handlePlay(e.detail);
          break;

        case 'handleTimeUpdate':
          this.handleTimeUpdate(e.detail);
          break;

        default:
          break;
      }
    });
    document.body.addEventListener('mouseup', () => {
      this.endSeek();
    });
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.context.play !== this.state.audioState) {
      if (this.context.play === 'playing') {
        if (prevState.audioState !== this.context.play) {
          this.setState({
            audioState: 'playing'
          });
          this.context.updatePlayer('playing');
          this.playClicked();
        }
      } else if (this.context.play === 'stopped' || this.context.play === 'paused') {
        if (prevState.audioState !== this.context.play) {
          // movethis into function?

          this.setState({
            audioState: 'paused'
          });
          // this.context.updatePlayer('paused');
          this.pauseClicked();
        }
      } else if (this.context.play === 'loading') {
        // these prevent double loading
        if (prevState.audioState !== this.context.play) {
          this.setState({
            audioState: this.context.play
          });
          if (!this.context.currentTrack.title) {
            // if no title ie not a track, playstream
            this.playClicked();
          }
        }
      }
    }

    // this is triggered by mini player ie has title, is a track
    if (this.context.currentTrack.title && this.context.currentTrack.title !== this.state.trackTitle) {
      this.handleSetCurrentTrack(this.context.currentTrack);
      if (this.state.audioState !== 'playing') {
        this.playClicked(this.context.currentTrack.timeCode);
      } else {
        if (this.context.currentTrack.id !== this.state.trackId) {
          this.pauseClicked();
          this.playClickedMini(this.context.currentTrack.timeCode);
        }
      }
    } else if (this.context.currentTrack.title && this.context.currentTrack.title !== this.state.trackTitle) {
    }
  }

  render () {
    let trackLength;
    if (this.state.trackLength) {
      trackLength = this.state.trackLength;
    } else if (bridgePlayer.getPlaylist().endTime) {
      trackLength = dayjs
        .duration(dayjs(bridgePlayer.getPlaylist().endTime).diff(dayjs(bridgePlayer.getPlaylist().clockTime)))
        .asSeconds();
    }

    let playButton;
    if (this.state.audioState === 'error') {
      playButton = (
        <div className='button error'>
          <i className='icon flaticon-error' />
        </div>
      );
    } else if (this.state.audioState === 'playing' || this.state.audioState === 'loading') {
      playButton = (
        <div
          className='button pause'
          onClick={() => {
            this.context.updatePlayer('paused');
            // this.pauseClicked.bind(this);
          }}
        >
          <i className='icon flaticon-pause' />
        </div>
      );
    } else if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      playButton = (
        <div
          className='button play'
          onClick={() => {
            this.context.updatePlayer('loading');
          }}
        >
          <i className='icon flaticon-play' />
        </div>
      );
    }

    let trackTime;
    let endTime;
    // If there's a timecode, show the real clock time rather than the track time
    if (
      bridgePlayer.getPlaylist().tracks.length === 0 &&
      !bridgePlayer.getCurrentTrack().url &&
      this.props.liveUrls.length > 0
    ) {
      trackTime = 'Live Radio';
    } else if (bridgePlayer.getCurrentTrack().type === 'stream') {
      trackTime = dayjs().format('hh:mm:ss a');
      // } else if (this.state.clockTime) {
      //   // trackTime = this.state.clockTime;
      //   // endTime = dayjs(bridgePlayer.getPlaylist().clockTime).add(trackLength, 'seconds').format('hh:mm:ss a');
      //   // trackTime = dayjs(bridgePlayer.getCurrentTrack().timeCode).format('hh:mm:ss a');
      //   // trackTime = dayjs(bridgePlayer.getCurrentTrack().timeCode).format('hh:mm:ss a');
      //   // endTime = dayjs(bridgePlayer.getCurrentTrack().timeCode).add(trackLength, 'seconds').format('hh:mm:ss a');

      //   trackTime = dayjs(bridgePlayer.getCurrentTrack().timeCode, format('hh:mm:ss')).format('hh:mm:ss a');
      //   // endTime = dayjs(bridgePlayer.getCurrentTrack().timeCode, format('hh:mm:ss'))
      //   // .add(trackLength, 'seconds')
      //   // .format('hh:mm:ss a');
    } else if (bridgePlayer.getCurrentTrack().timeCode || bridgePlayer.getCurrentTrack().timeCode === 0) {
      // if (bridgePlayer.getPlaylist().clockTime) {
      // trackTime = dayjs(bridgePlayer.getPlaylist().clockTime).format('hh:mm:ss a');
      // endTime = dayjs(bridgePlayer.getPlaylist().clockTime).add(trackLength, 'seconds').format('hh:mm:ss a');
      // } else {
      // trackTime = dayjs(bridgePlayer.getCurrentTrack().timeCode).format('hh:mm:ss a');
      trackTime = dayjs(`01/01/70 ${bridgePlayer.getCurrentTrack().timeCode}`, 'hh:mm:ss').format('h:mm:ss a');
      // trackTime = bridgePlayer.getCurrentTrack().timeCode;
      // endTime = dayjs(bridgePlayer.getCurrentTrack().timeCode).add(trackLength, 'seconds').format('hh:mm:ss a');
    } else {
      let minutes = Math.floor(this.state.trackTime / 60);
      let secs = Math.floor(this.state.trackTime % 60);
      let hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      trackTime = ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + secs).slice(-2);

      minutes = Math.floor(trackLength / 60);
      secs = Math.floor(trackLength % 60);
      hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      endTime = ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + secs).slice(-2);
    }

    let percentage;
    if (bridgePlayer.getCurrentTrack().type === 'stream') {
      percentage = 0;
    } else {
      percentage = this.state.trackTime / trackLength * 100;
    }

    const segments = bridgePlayer.getPlaylist().tracks.map((track, index) => {
      const xPos = track.timeCode / trackLength * 100;
      return (
        <div
          className={`bar-segment${bridgePlayer.getCurrentTrack().id === track.id ? ' playing' : ''}`}
          key={index}
          style={{ left: xPos + '%' }}
        />
      );
    });

    let shareSegmentButton;
    if (!this.props.hideShareButtons) {
      shareSegmentButton = (
        <div className='lower'>
          <div className='share-button playerSegmentSharer'>Share Segment</div>
        </div>
      );
    }

    let trackTitle;
    if (this.state.audioState === 'error') {
      trackTitle = 'Error loading audio';
    } else if (bridgePlayer.getPlaylist().tracks.length === 0 && !bridgePlayer.getCurrentTrack().url) {
      if (this.props.liveUrls && this.props.liveUrls.length > 0) {
        trackTitle = 'Click play to listen to Live Radio';
      } else {
        trackTitle = 'No tracks';
      }
    } else {
      trackTitle = this.state.trackTitle;
    }

    let trackArtist = this.state.trackArtist ? this.state.trackArtist + ' - ' : null;

    let switchType;
    if (bridgePlayer.getCurrentTrack().type === 'stream' && this.state.previousPlaylist) {
      switchType = (
        <div className='switch-type' onClick={this.backToPreviousPlaylist.bind(this, this.state.previousPlaylist)}>
          Back to On-Demand
        </div>
      );
    } else if (
      this.props.liveUrls &&
      this.props.liveUrls.length > 0 &&
      bridgePlayer.getPlaylist().tracks.length > 0 &&
      bridgePlayer.getCurrentTrack().url
    ) {
      switchType = (
        <div className='switch-type' onClick={this.playStream.bind(this, this.props.liveUrls[0])}>
          Listen To {unescape(this.props.liveUrls[0].title)} Live
        </div>
      );
    }

    let showTime;
    if (bridgePlayer.getCurrentTrack().type === 'stream') {
      showTime = `(${dayjs().format('ddd Do')})`;
    } else {
      showTime = `(${dayjs(bridgePlayer.getPlaylist().clockTime).format('ddd Do')})`;
    }

    // Don't display show name if it's the same as the track title
    let showName;
    if (bridgePlayer.getPlaylist().title && bridgePlayer.getPlaylist().title !== trackTitle) {
      showName = unescape(bridgePlayer.getPlaylist().title);
    }

    return (
      <div>
        <div className={`amrap-player-outer container ${this.state.shrink ? 'shrink-override' : ''}`}>
          <div className={`left-buttons${this.state.audioState === 'loading' ? ' loading' : ''}`}>
            <div className='upper'>
              <div
                className={`button previous${bridgePlayer.previousTrackAvailable() ? '' : ' disabled'}`}
                onClick={this.previousTrackClicked.bind(this)}
              >
                <i className='icon flaticon-skip-backward' />
              </div>
              <div
                className={`button seek-left${bridgePlayer.getCurrentTrack().type === 'stream' ? ' disabled' : ''}`}
                onMouseDown={this.startSeekLeft.bind(this)}
              >
                <i className='icon flaticon-seek-backward' />
              </div>
              {playButton}
              <div className='button loading'>
                <div className='loader-outer active'>
                  <div className='loader' />
                </div>
              </div>
              <div
                className={`button seek-right${bridgePlayer.getCurrentTrack().type === 'stream' ? ' disabled' : ''}`}
                onMouseDown={this.startSeekRight.bind(this)}
              >
                <i className='icon flaticon-seek-forward' />
              </div>
              <div
                className={`button next${bridgePlayer.nextTrackAvailable() ? '' : ' disabled'}`}
                onClick={this.nextTrackClicked.bind(this)}
              >
                <i className='icon flaticon-skip-forward' />
              </div>
            </div>
            {shareSegmentButton}
          </div>
          <div className='track-status'>
            <div className='mid'>
              <div className='left'>
                <div className='artist'>{this.state.audioState === 'error' ? null : trackArtist}</div>
                <div className='title'>{trackTitle}</div>
                <div className='show-name'>
                  {showName} {showTime}
                </div>
              </div>
              <div className='right'>{switchType}</div>
            </div>
            <div className='lower'>
              <div className='precise-clock' style={{ background: 'pink' }}>
                {trackTime}
              </div>
              <div
                className='bar'
                onClick={this.barClick.bind(this)}
                onMouseLeave={this.barMouseLeave.bind(this)}
                onMouseMove={this.barMouseMove.bind(this)}
                ref='bar'
              >
                <div
                  className='bar-popup'
                  style={{
                    left: this.state.hoverTimeX - 40,
                    display:
                      bridgePlayer.getCurrentTrack().type !== 'stream' && this.state.hoverTimeVisible ? 'flex' : 'none'
                  }}
                >
                  {this.state.hoverTimeContent}
                </div>
                <div className='bar-background' style={{ width: percentage + '%' }} />
                {segments}
              </div>
              <div className='track-time'>{endTime}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

PlayerView.contextType = AmrapContext;
