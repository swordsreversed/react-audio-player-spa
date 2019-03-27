// -------------------------------------------------------------
// AMRAP top audio player for mobile
// -------------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import unescape from 'lodash.unescape'
import mobileCss from '../less/amrap-mobile-player.less'
import bridgePlayer from './player-wrapper.js'
import fastClick from 'fastclick'

export default class PlayerView extends React.Component {

    constructor (props) {
        super(props)
        this.state = {
            audioState: 'stopped', // playing | stopped | paused | loading
            currentAudio: null,
            currentPlaylist: {},
            trackTime: 0,
            trackTitle: unescape(bridgePlayer.getPlaylist().title) || 'Press play',
            trackLength: 1,
            volume: 100,
            seekSpeed: 1
        }
    }

    startSeekLeft () {
        this.seekSpeedToken = setInterval(() => {
            if (this.state.seekSpeed <= 32) {
                this.setState({
                    seekSpeed: this.state.seekSpeed * 2
                })
            }
        }, 700)
        this.seekToken = setInterval(() => {
            const newTime = this.state.trackTime - this.state.seekSpeed
            bridgePlayer.seekSeconds(newTime)
            this.setState({
                trackTime: newTime
            })
        }, 200)
    }

    startSeekRight () {
        this.seekSpeedToken = setInterval(() => {
            if (this.state.seekSpeed <= 32) {
                this.setState({
                    seekSpeed: this.state.seekSpeed * 2
                })
            }
        }, 700)
        this.seekToken = setInterval(() => {
            const newTime = this.state.trackTime + this.state.seekSpeed
            bridgePlayer.seekSeconds(newTime)
        }, 200)
    }

    endSeek () {
        clearInterval(this.seekToken)
        clearInterval(this.seekSpeedToken)
        this.setState({
            seekSpeed: 1
        })
    }

    handlePlay (data) {
        this.setState({
            audioState: 'playing',
            trackTitle: data.title,
            trackArtist: data.artist,
            trackLength: data.audio.duration,
            trackTime: Math.floor(data.audio.currentTime) || data.timeCode || 0
        })
    }

    handlePause (data) {
        this.setState({
            audioState: 'paused'
        })
    }

    handleStop () {
        this.setState({
            audioState: 'stopped',
            trackTime: 0
        })
    }

    handleLoading (data) {
        this.setState({
            audioState: 'loading',
            trackTitle: data.title,
            trackArtist: data.artist,
        })
    }

    handleError (data) {
        this.setState({
            audioState: 'error',
        })
    }

    handleTimeUpdate (data) {
        this.setState({
            trackTime: Math.floor(data.audio.currentTime),
            trackLength: data.audio.duration || this.state.trackLength,
            trackTitle: data.title,
            trackArtist: data.artist,
            clockTime: data.clockTime
        })
    }

    playStream (streamInfo) {
        if (unescape(bridgePlayer.getPlaylist().title)) {
            this.setState({
                previousPlaylist: bridgePlayer.getPlaylist()
            })
        }
        bridgePlayer.playStream(streamInfo.guideName, streamInfo.browserLiveStreamUrl, 'http://airnet.org.au/rest/stations/' + window.stationCallSign + '/guides/' + streamInfo.guideId)
    }

    playClicked () {
        if (bridgePlayer.getPlaylist().tracks.length === 0 && !bridgePlayer.getCurrentTrack().url && this.props.liveUrls.length > 0) {
            this.playStream(this.props.liveUrls[0])
        } else {
            bridgePlayer.playTrack()
        }
    }

    pauseClicked () {
        bridgePlayer.pauseTrack()
    }

    nextTrackClicked () {
        bridgePlayer.nextTrack()
    }

    previousTrackClicked () {
        bridgePlayer.previousTrack()
    }

    barClick (event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const percent = (mouseX - ReactDOM.findDOMNode(this.refs.bar).getBoundingClientRect().left) / ReactDOM.findDOMNode(this.refs.bar).offsetWidth
        if (bridgePlayer.getCurrentTrack().type !== 'stream') {
            this.setState({
                trackTime: this.state.trackLength * percent
            })
            bridgePlayer.seekPercentage(percent * 100)
        }
    }

    componentDidMount () {
        bridgePlayer.addListener('mobilePlayer', this)
        fastClick.attach(document.body);
    }

    render () {
        let trackLength
        if (this.state.trackLength) {
            trackLength = this.state.trackLength
        } else if (bridgePlayer.getPlaylist().endTime) {
            trackLength = moment.duration(moment(bridgePlayer.getPlaylist().endTime).diff(moment(bridgePlayer.getPlaylist().clockTime))).asSeconds()
        } else {
            return
        }

        let playButton
        if (this.state.audioState === 'error') {
            playButton = <div className='button error'><i className='icon flaticon-error' /></div>
        } else if (this.state.audioState === 'playing' || this.state.audioState === 'loading') {
            playButton = <div className='button pause' onTouchEnd={this.pauseClicked.bind(this)}><i className='icon flaticon-pause' /></div>
        } else if (this.state.audioState === 'paused' || this.state.audioState === 'stopped') {
            playButton = <div className='button play' onTouchEnd={this.playClicked.bind(this)}><i className='icon flaticon-play' /></div>
        }

        let trackTime
        let endTime
        // If there's a timecode, show the real clock time rather than the track time
        if (bridgePlayer.getPlaylist().tracks.length === 0 && !bridgePlayer.getCurrentTrack().url && this.props.liveUrls.length > 0) {
            trackTime = 'Live Radio'
        } else if (bridgePlayer.getCurrentTrack().type === 'stream') {
            trackTime = moment().format('hh:mm:ss a')
        } else if (this.state.clockTime) {
            trackTime = this.state.clockTime
            endTime = moment(bridgePlayer.getPlaylist().clockTime).add(trackLength, 'seconds').format('hh:mm:ss a')
        } else if (bridgePlayer.getCurrentTrack().timeCode || bridgePlayer.getCurrentTrack().timeCode === 0) {
            trackTime = moment(bridgePlayer.getPlaylist().clockTime).format('hh:mm:ss a')
            endTime = moment(bridgePlayer.getPlaylist().clockTime).add(trackLength, 'seconds').format('hh:mm:ss a')
        } else {
            let minutes = Math.floor(this.state.trackTime / 60)
            let secs = Math.floor(this.state.trackTime % 60)
            let hours = Math.floor(minutes / 60)
            minutes = minutes % 60
            trackTime = ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + secs).slice(-2)

            minutes = Math.floor(trackLength / 60)
            secs = Math.floor(trackLength % 60)
            hours = Math.floor(minutes / 60)
            minutes = minutes % 60
            endTime = ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + secs).slice(-2)
        }

        let percentage
        if (bridgePlayer.getCurrentTrack().type === 'stream') {
            percentage = 0
        } else {
            percentage = (this.state.trackTime / this.state.trackLength) * 100
        }

        return (
            <div className={`amrap-mobile-player-outer container ${this.state.shrink ? 'shrink-override' : ''}`}>
                <div className='upper'>
                    <div className={`left-buttons${ this.state.audioState === 'loading' ? ' loading' : ''}`}>
                        <div className='upper'>
                            <div className={`button previous${ bridgePlayer.previousTrackAvailable() ? '' : ' disabled' }`} onTouchEnd={this.previousTrackClicked.bind(this)}><i className='icon flaticon-skip-backward' /></div>
                            <div className={`button seek-left${ bridgePlayer.getCurrentTrack().type === 'stream' ? ' disabled' : '' }`} onTouchStart={this.startSeekLeft.bind(this)} onTouchEnd={this.endSeek.bind(this)}><i className='icon flaticon-seek-backward' /></div>
                            {playButton}
                            <div className='button loading'>
                                <div className='loader-outer active'>
                                    <div className='loader' />
                                </div>
                            </div>
                            <div className={`button seek-right${ bridgePlayer.getCurrentTrack().type === 'stream' ? ' disabled' : '' }`} onTouchStart={this.startSeekRight.bind(this)} onTouchEnd={this.endSeek.bind(this)}><i className='icon flaticon-seek-forward' /></div>
                            <div className={`button next${ bridgePlayer.nextTrackAvailable() ? '' : ' disabled' }`} onTouchEnd={this.nextTrackClicked.bind(this)}><i className='icon flaticon-skip-forward' /></div>
                        </div>
                        <div className='lower'>
                            <div className='share-button playerSegmentSharer'>Share Segment</div>
                        </div>
                    </div>
                    <div className='track-status'>
                        <div className='mid'>
                            <div className='left'>
                                <div className='title'>{this.state.trackTitle}{this.state.trackArtist ? ` - ${this.state.trackArtist}` : ''}</div>
                            </div>
                        </div>
                        <div className='lower'>
                            <div className='text'>
                                <div className='seek-controls'>
                                    <div className='precise-clock'>{trackTime}</div>
                                    {/*<div className='lower'>
                                        <div className='share-button playerTimeSharer'>Share This Moment</div>
                                    </div>*/}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='lower'>
                    <div className='bar' onTouchEnd={this.barClick.bind(this)} ref='bar'>
                        <div className='bar-background' style={{ width: percentage + '%'}} />
                    </div>
                </div>
            </div>
        );
    }
}
