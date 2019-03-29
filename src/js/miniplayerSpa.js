// -------------------------------------------------------------
// Mini audio player.
// -------------------------------------------------------------

import React from 'react';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import AmrapContext from './contextProvider';

export default class MiniPlayerSpa extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      self: 0,
      audioState: this.props.loading ? 'loading' : 'stopped' // playing | stopped | paused | loading
    };
  }

  componentDidUpdate (prevProps, prevState) {
    // if not the focused track should not be playing - do we need this?
    if (this.state.self !== 0 && this.context.playingId !== this.state.self) {
      if (this.state.audioState === 'playing') {
        this.setState({
          audioState: 'stopped'
        });
      }
    }

    // this is the focused track
    if (this.state.self === this.context.playingId && this.state.self !== 0) {
      if (this.context.play === 'playing') {
        if (prevState.audioState !== this.context.play) {
          this.setState({ audioState: 'playing' });
        }
      } else if (this.context.play === 'stopped' || this.context.play === 'paused') {
        if (prevState.audioState !== this.context.play) {
          this.setState({ audioState: 'paused' });
        }
      } else if (this.context.play === 'loading') {
        if (prevState.audioState !== this.context.play) {
          this.setState({ audioState: 'loading' });
        }
      }
    }
  }

  checkCurrentTrack (data) {
    if (data.id === this.props.id) {
      this.setState({
        audioState: 'playing'
      });
    } else {
      this.setState({
        audioState: 'stopped'
      });
    }
  }

  handlePlay (data) {
    if (data.type !== 'stream') {
      this.checkCurrentTrack(data);
    } else {
      this.setState({
        audioState: 'playing'
      });
    }
  }

  // TODO: a lot of the logic is for handling specific OD track ids eg checkCurrentTrack
  // pull out to miniplayer without track logic for live streams?
  handleTimeUpdate (data) {
    if (this.state.audioState !== 'paused' && !this.props.loading && this.props.type !== 'stream') {
      this.checkCurrentTrack(data);
    }
  }

  handlePause (data) {
    if (data.id === this.props.id) {
      this.setState({
        audioState: 'paused'
      });
    }
  }

  handleStop () {
    this.setState({
      audioState: 'stopped'
    });
  }

  handleLoadingOld (data) {
    if (data.id === this.props.id) {
      this.setState({
        audioState: 'loading'
      });
    } else {
      this.setState({
        audioState: 'stopped'
      });
    }
  }

  handleLoading () {
    this.setState({
      audioState: 'loading'
    });
  }

  playClicked () {
    let context = this.context;
    context.updatePlayer('loading');
    let { track } = this.props;
    if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      this.setState({
        self: track.id
      });

      if (context.currentTrack.url !== track.url) {
        context.setCurrentTrack({
          id: track.id,
          url: track.url.toLowerCase(),
          title: track.title,
          artist: track.artist,
          type: track.type,
          timeCode: track.time
        });
        context.updatePlayingId(track.id);
      } else {
        context.setCurrentTrack({
          id: track.id,
          url: track.url,
          title: track.title,
          artist: track.artist,
          type: track.type,
          timeCode: track.time
        });
        context.updatePlayingId(track.id);
      }
    } else if (this.state.audioState === 'playing') {
      this.setState({
        audioState: 'paused'
      });

      context.updatePlayer('paused');
    }
  }

  render () {
    let button;
    let { track } = this.props;

    if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      button = (
        <div className='mini-player' onClick={this.playClicked.bind(this)}>
          <PlayArrowIcon />
        </div>
      );
    } else if (this.state.audioState === 'loading') {
      button = (
        <div className='mini-player'>
          <div className='loader-outer active'>
            <div className='loader' />
          </div>
        </div>
      );
    } else if (this.state.audioState === 'playing') {
      button = (
        <div className='mini-player' onClick={this.playClicked.bind(this)}>
          <PauseIcon />
        </div>
      );
    }

    return <div style={{ display: track.time ? 'inline' : 'none' }}>{button}</div>;
  }
}

MiniPlayerSpa.contextType = AmrapContext;
