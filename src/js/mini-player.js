// -------------------------------------------------------------
// Mini audio player.
// -------------------------------------------------------------

import React from 'react';
import bridgePlayer from './player-wrapper.js';
import css from '../less/mini-player.less';

export default class MiniPlayer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      audioState: this.props.loading ? 'loading' : 'stopped' // playing | stopped | paused | loading
    };
  }

  componentDidMount () {
    bridgePlayer.addListener('mini-player' + this.props.id, this);
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.loading && !this.props.loading) {
      this.setState({ audioState: 'stopped' });
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

  handleLoading (data) {
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

  playClicked () {
    console.log('====================================');
    console.log('playclicked', this.state.audioState);
    console.log('====================================');

    if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      // If the current track is not even the same url as this one
      if (bridgePlayer.getCurrentTrack().url !== this.props.url) {
        bridgePlayer.stopTrack();
        bridgePlayer.setCurrentTrack(
          this.props.id,
          this.props.url,
          this.props.title,
          this.props.artist,
          this.props.type,
          this.props.timeCode
        );
        if (this.props.playlist) {
          bridgePlayer.setPlaylist(this.props.playlist);
        }
        setTimeout(() => {
          bridgePlayer.playTrack();
          if (this.props.timeCode || this.props.timeCode === 0) {
            bridgePlayer.setTimeCode(this.props.timeCode);
          }
        }, 50);
        // Otherwise if it's the same url (i.e they're part of the same radio show), seek to this track
      } else if (bridgePlayer.getCurrentTrack().url === this.props.url) {
        if (!bridgePlayer.getCurrentTrack().audio) {
          bridgePlayer.setCurrentTrack(
            this.props.id,
            this.props.url,
            this.props.title,
            this.props.artist,
            this.props.type,
            this.props.timeCode
          );
          setTimeout(() => {
            bridgePlayer.playTrack();
            if (this.props.timeCode || this.props.timeCode === 0) {
              bridgePlayer.setTimeCode(this.props.timeCode);
            }
          }, 50);
        } else {
          if (this.state.audioState === 'paused') {
            bridgePlayer.playTrack(this.props.timeCode);
          } else {
            bridgePlayer.seekSeconds(this.props.timeCode);
          }
        }
      }
    } else if (this.state.audioState === 'playing') {
      bridgePlayer.pauseTrack();
    }
  }

  render () {
    let button;
    if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      button = (
        <div className='mini-player' onClick={this.playClicked.bind(this)}>
          <i className='icon fa fa-play' />
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
          <i className='icon fa fa-pause' />
        </div>
      );
    }

    return button;
  }
}
