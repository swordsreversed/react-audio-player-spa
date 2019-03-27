import React from 'react';
import ReactDOM from 'react-dom';

export class AmrapPopoutPortal extends React.Component {
  render () {
    return ReactDOM.createPortal(this.props.children, document.getElementById('amrapPlayer'));
  }
}

export class AmrapMiniPortal extends React.Component {
  render () {
    return ReactDOM.createPortal(this.props.children, document.getElementById('amrapPage'));
  }
}
