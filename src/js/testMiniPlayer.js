// -------------------------------------------------------------
// Mini audio player.
// -------------------------------------------------------------

import React, { Fragment } from 'react';
import AmrapContext from './contextProvider';

// const bridgePlayer = new Player();

export default class TestMiniPlayer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      audioState: this.props.loading ? 'loading' : 'stopped' // playing | stopped | paused | loading
    };
  }

  render () {
    let value = this.context;
    let playerButton =
      value.play === 'stopped' || value.play === 'paused' ? (
        <button onClick={() => value.updatePlayer('playing')}>Play</button>
      ) : (
        <button onClick={() => value.updatePlayer('paused')}>Pause</button>
      );

    return (
      <Fragment>
        <div>{playerButton}</div>
        <AmrapContext.Consumer>
          {(sharedState) => (
            <div>
              {/* <input
                value={sharedState.play}
                onChange={(e) => sharedState.updateImportantValue(e.target.value)}
              /> */}
            </div>
          )}
        </AmrapContext.Consumer>
      </Fragment>
    );
  }
}

TestMiniPlayer.contextType = AmrapContext;
