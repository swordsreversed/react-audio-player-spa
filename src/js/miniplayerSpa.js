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
      self: false,
      audioState: this.props.loading ? 'loading' : 'stopped' // playing | stopped | paused | loading
    };
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.self) {
      if (this.context.play === 'playing') {
        if (prevState.audioState !== this.context.play) {
          this.setState({
            audioState: 'playing'
          });
        }
      } else if (this.context.play === 'stopped' || this.context.play === 'paused') {
        if (prevState.audioState !== this.context.play) {
          this.setState({
            audioState: 'paused'
          });
        }
      } else if (this.context.play === 'loading') {
        if (prevState.audioState !== this.context.play) {
          this.setState({
            audioState: 'loading'
          });
        }
      }
    }
  }

  // componentDidUpdate (prevProps, prevState) {
  //   if (prevProps.loading && !this.props.loading) {
  //     this.setState({ audioState: 'stopped' });
  //   }
  // }

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
    let { track } = this.props;
    if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
      this.setState({
        self: 'true'
      });
      console.log('====================================');
      console.log('kick off OD');
      console.log('====================================');

      // this.setState({
      //   audioState: context.play
      // });

      if (context.currentTrack.url !== track.url) {
        console.log('====================================');
        console.log('differnt tracks!', context.currentTrack.url);
        console.log('====================================');

        context.setCurrentTrack({
          id: track.id,
          url: track.url,
          title: track.title,
          artist: track.artist,
          type: track.type,
          timeCode: track.time
        });
      }

      //   approximateTime: "2019-01-19 06:00:00"
      // artist: "Raconteurs"
      // contentDescriptors: {isAustralian: false, isLocal: null, isFemale: false, isIndigenous: null, isNew: null}
      // id: 5658857
      // image: "https://i.ytimg.com/vi/ZzgaOVWbZiU/hqdefault.jpg"
      // notes: null
      // release: null
      // time: "06:00:00"
      // title: "Carolina Drama"
      // track: "Carolina Drama"
      // twitterHandle: null
      // type: "track"
      // url: null
      // video: "http://www.youtube.com/embed/ZzgaOVWbZiU"
      // wikipedia: "The Raconteurs"

      // check sharedstate.play
      // we shouldnt have play state unless click originated here
      // if so shared.play should set stop

      // If the current track is not even the same url as this one
      // if (bridgePlayer.getCurrentTrack().url !== this.props.url) {
      //   bridgePlayer.stopTrack();
      //   bridgePlayer.setCurrentTrack(
      //     this.props.id,
      //     this.props.url,
      //     this.props.title,
      //     this.props.artist,
      //     this.props.type,
      //     this.props.timeCode
      //   );
      //   if (this.props.playlist) {
      //     bridgePlayer.setPlaylist(this.props.playlist);
      //   }
      //   setTimeout(() => {
      //     bridgePlayer.playTrack();
      //     if (this.props.timeCode || this.props.timeCode === 0) {
      //       bridgePlayer.setTimeCode(this.props.timeCode);
      //     }
      //   }, 50);
      //   // Otherwise if it's the same url (i.e they're part of the same radio show), seek to this track
      // } else if (bridgePlayer.getCurrentTrack().url === this.props.url) {
      //   if (!bridgePlayer.getCurrentTrack().audio) {
      //     bridgePlayer.setCurrentTrack(
      //       this.props.id,
      //       this.props.url,
      //       this.props.title,
      //       this.props.artist,
      //       this.props.type,
      //       this.props.timeCode
      //     );
      //     setTimeout(() => {
      //       bridgePlayer.playTrack();
      //       if (this.props.timeCode || this.props.timeCode === 0) {
      //         bridgePlayer.setTimeCode(this.props.timeCode);
      //       }
      //     }, 50);
      //   } else {
      //     if (this.state.audioState === 'paused') {
      //       bridgePlayer.playTrack(this.props.timeCode);
      //     } else {
      //       bridgePlayer.seekSeconds(this.props.timeCode);
      //     }
      //   }
      // }
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
