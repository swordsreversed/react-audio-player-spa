import React from 'react';

const AmrapContext = React.createContext({});

export class AmrapContextProvider extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      play: 'stopped',
      playingId: 0,
      updatePlayer: (play) => {
        this.setState({ play });
      },
      updatePlayingId: (playingId) => {
        this.setState({ playingId });
      },
      currentTrack: {
        id: '',
        url: '',
        title: '',
        artist: '',
        type: '',
        timeCode: 0
      },
      setCurrentTrack: (currentTrack) => {
        this.setState({ currentTrack });
      }
    };
  }

  render () {
    return <AmrapContext.Provider value={this.state}>{this.props.children}</AmrapContext.Provider>;
  }
}

export default AmrapContext;
