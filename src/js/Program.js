import React, { Component, Fragment } from 'react';
import rp from 'request-promise';
import UrlPattern from 'url-pattern';
import dayjs from 'dayjs';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import MiniPlayerSpa from './miniPlayerSpa';
import '../scss/amrapPage.scss';
import AmrapContext from './contextProvider';

class Program extends Component {
  constructor (props) {
    super(props);
    this.state = {
      program: {},
      episodeList: [],
      currentEpisode: {},
      playlist: null,
      audioState: 'stopped',
      path: window.location.pathname,
      tabValue: 0,
      loadingPlaylist: false
    };
    this.getApi = this.getApi.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);

    let self = this;
    // eslint-disable-next-line no-undef
    var realPushState = history.pushState;
    // eslint-disable-next-line no-undef
    history.pushState = function (arg1, arg2, arg3) {
      self.setState({
        path: arg1
      });
      // eslint-disable-next-line no-undef
      return realPushState.apply(history, [
        null,
        null,
        arg1
      ]);
    };
  }

  async componentDidMount () {
    let { audioFile, callSign } = this.props;
    // TODO playlists?
    // TODO fix window vars in index
    // TODO fix time in popout player - handleupdate
    // TODO general cleanup
    // if (callSign) {
    const pattern = new UrlPattern('/program(/:name)(/:episode)(/:track)');
    let urlPaths = pattern.match(window.location.pathname);
    if (urlPaths) {
      let program = await this.getApi(
        `http://staging.airnet.org.au/rest/stations/${callSign}/programs/${urlPaths.name}`
      );
      let episodes = await this.getApi(
        `http://staging.airnet.org.au/rest/stations/${callSign}/programs/${urlPaths.name}/episodes`
      );
      let episodeList = episodes.slice(0, 10);
      let curEp = episodes.filter((ep) => ep.currentEpisode);
      let episode = await this.getApi(curEp[0].episodeRestUrl);
      let playlist = await this.getApi(episode.playlistRestUrl);

      let newaudioFile = this.props.audioFile.replace('???PROGRAM???', urlPaths.name);
      newaudioFile = newaudioFile.replace('???EPISODE???', dayjs(episode.start).format('YYYYMMDDHHss'));
      episodeList.forEach((episode) => {
        episode.dateLabel = dayjs(episode.start).format("ddd DD MMM 'YY");
      });

      playlist.forEach((track) => {
        track.url = newaudioFile;
      });

      this.setState({
        thisPage: window.location.href,
        program: program,
        episodeList: episodeList,
        currentEpisode: curEp[0],
        playlist: playlist,
        tabValue: episodeList.length - 1
      });
    }
    // }
  }

  async componentDidUpdate (prevProps, prevState) {
    let { audioFile, callSign } = this.props;

    if (prevState.path !== this.state.path) {
      console.log('====================================');
      console.log(this.state);
      console.log('====================================');
      let paths = this.state.path.split('/');
      let programName = paths[2];
      let program = await this.getApi(`http://staging.airnet.org.au/rest/stations/${callSign}/programs/${programName}`);
      let episodeList = await this.getApi(
        `http://staging.airnet.org.au/rest/stations/3pbs/programs/${programName}/episodes`
      );
      let curEp = episodeList.filter((ep) => ep.currentEpisode);
      let episode = await this.getApi(curEp[0].episodeRestUrl);
      let playlist = await this.getApi(episode.playlistRestUrl);

      audioFile = audioFile.replace('???PROGRAM???', programName);
      audioFile = audioFile.replace('???EPISODE???', dayjs(episode.start).format('YYYYMMDDHHss'));
      episodeList.forEach((episode) => {
        episode.dateLabel = dayjs(episode.start).format("ddd DD MMM 'YY");
      });

      playlist.forEach((track) => {
        track.url = audioFile;
      });

      this.setState({
        thisPage: window.location.href,
        program: program,
        episodeList: episodeList,
        currentEpisode: curEp[0],
        playlist: playlist,
        tabValue: episodeList.length - 1
      });
    }

    // change playlist
    if (prevState.currentEpisode.start !== this.state.currentEpisode.start) {
      this.setState({
        loadingPlaylist: true
      });
      let episode = await this.getApi(this.state.currentEpisode.episodeRestUrl);
      let playlist = await this.getApi(episode.playlistRestUrl);

      audioFile = audioFile.replace('???PROGRAM???', this.state.program.name);
      audioFile = audioFile.replace('???EPISODE???', dayjs(this.state.currentEpisode.start).format('YYYYMMDDHHss'));

      playlist.forEach((track) => {
        track.url = audioFile;
      });

      this.setState({
        playlist: playlist,
        loadingPlaylist: false
      });
    }
  }

  async getApi (url, path) {
    const response = await rp(url);
    return JSON.parse(response);
  }

  handleTabChange (event, value) {
    this.setState({ tabValue: value });
  }

  loadEpisode (episode) {
    this.setState({
      currentEpisode: episode
    });
  }

  render () {
    let { currentEpisode, episodeList, playlist, tabValue, loadingPlaylist } = this.state;

    return (
      <Fragment>
        {episodeList.length > 0 && (
          <div>
            <Tabs
              style={{ overflow: 'hidden' }}
              value={tabValue}
              onChange={this.handleTabChange}
              variant='scrollable'
              scrollButtons='on'
            >
              {episodeList.map((episode, i) => (
                <Tab
                  key={i}
                  classes={{ selected: 'selected-tab' }}
                  label={episode.dateLabel}
                  onClick={() => this.loadEpisode(episode)}
                />
              ))}
            </Tabs>
            <div className='playlistContainer'>
              <h1>{currentEpisode.title}</h1>
              {loadingPlaylist && <h4>Loading...</h4>}
              {!loadingPlaylist && (
                <Table className='playlistInner'>
                  {playlist.map((track, i) => <TrackView track={track} key={i} />)}
                </Table>
              )}
            </div>
          </div>
        )}
      </Fragment>
    );
  }
}

const TrackView = (props) => {
  let { track } = props;

  return (
    <TableBody>
      <TableRow
        id={`playlist-${track.id}`}
        data-timecode={track.approximateTime}
        data-title={track.title}
        data-artist={track.artist}
      >
        <TableCell style={{ display: 'none' }}>{track.id}</TableCell>
        <TableCell>{track.time}</TableCell>
        <TableCell>
          {track.artist} - {track.title}
        </TableCell>
        <TableCell data-time={track.time}>
          <div className='mini-player'>
            <MiniPlayerSpa track={track} />
          </div>
        </TableCell>
        <TableCell className='trackContent'>
          <a href='' rel='nofollow'>
            info
          </a>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

export default Program;
Program.contextType = AmrapContext;
