// -------------------------------------------------------------
// Mini audio player.
// -------------------------------------------------------------

import React from 'react'
import MiniPlayer from './mini-player.jsx'
import bridgePlayer from './player-wrapper.js'

export default class MiniPlayerWithScrub extends React.Component {

    constructor (props) {
        super(props)
        this.state = {}
    }

    componentDidMount () {
        bridgePlayer.addListener('mini-player-controls' + this.props.id, this)
        document.body.addEventListener('mouseup', () => {
            this.endSeek()
        });
    }

    componentWillUnmount() {
        clearInterval(this.seekToken)
    }

    startScrubLeft () {
        this.refs.miniPlayer.playClicked()
        this.seekToken = setInterval(() => {
            bridgePlayer.changeTrackTime(bridgePlayer.getCurrentTrack().timeCode - 1)
            bridgePlayer.seekSeconds(bridgePlayer.getCurrentTrack().timeCode)
        }, 250)
    }

    startScrubRight () {
        this.refs.miniPlayer.playClicked()
        this.seekToken = setInterval(() => {
            bridgePlayer.changeTrackTime(bridgePlayer.getCurrentTrack().timeCode + 1)
            bridgePlayer.seekSeconds(bridgePlayer.getCurrentTrack().timeCode)
        }, 250)
    }

    endSeek () {
        clearInterval(this.seekToken)
    }

    render () {
        return (
            <div className='mini-player-outer'>
                <i className='scrub-left fa fa-backward' onMouseDown={this.startScrubLeft.bind(this)}></i>
                <MiniPlayer {...this.props} ref='miniPlayer' />
                <i className='scrub-right fa fa-forward' onMouseDown={this.startScrubRight.bind(this)}></i>
            </div>
        )
    }
}
