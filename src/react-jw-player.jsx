import React, { Component } from 'react';
import isEqual from 'react-fast-compare';

import createEventHandlers from './create-event-handlers';
import getCurriedOnLoad from './helpers/get-curried-on-load';
import getPlayerOpts from './helpers/get-player-opts';
import initialize from './helpers/initialize';
import installPlayerScript from './helpers/install-player-script';
import removeJWPlayerInstance from './helpers/remove-jw-player-instance';
import setJWPlayerDefaults from './helpers/set-jw-player-defaults';

import defaultProps from './default-props';
import propTypes from './player-prop-types';

const displayName = 'ReactJWPlayer';

class ReactJWPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adHasPlayed: false,
      hasPlayed: false,
      hasFired: {},
    };
    this.eventHandlers = createEventHandlers(this);
    this.uniqueScriptId = 'jw-player-script';

    if (props.useMultiplePlayerScripts) {
      this.uniqueScriptId += `-${props.playerId}`;
    }

    this.videoRef = null;
    this._initialize = this._initialize.bind(this);
    this._setVideoRef = this._setVideoRef.bind(this);
  }
  componentDidMount() {
    const isJWPlayerScriptLoaded = !!window.jwplayer;
    const existingScript = document.getElementById(this.uniqueScriptId);
    const isUsingMultiplePlayerScripts = this.props.useMultiplePlayerScripts;

    if (!isUsingMultiplePlayerScripts && isJWPlayerScriptLoaded) {
      this._initialize();
      return;
    }

    if (isUsingMultiplePlayerScripts && existingScript) {
      this._initialize();
      return;
    }

    if (!existingScript) {
      installPlayerScript({
        context: document,
        onLoadCallback: this._initialize,
        scriptSrc: this.props.playerScript,
        uniqueScriptId: this.uniqueScriptId,
      });
    } else {
      existingScript.onload = getCurriedOnLoad(existingScript, this._initialize);
    }
  }
  shouldComponentUpdate(nextProps) {
    const hasFileChanged = this.props.file !== nextProps.file;
    const hasPlaylistChanged = !isEqual(this.props.playlist, nextProps.playlist);

    return hasFileChanged || hasPlaylistChanged;
  }
  componentDidUpdate() {
    if (window.jwplayer && window.jwplayer(this.videoRef)) {
      this._initialize();
    }
  }
  componentWillUnmount() {
    removeJWPlayerInstance(this.videoRef, window);
  }
  _initialize() {
    const { playerId, useMultiplePlayerScripts } = this.props;

    if (useMultiplePlayerScripts) {
      setJWPlayerDefaults({ context: window, playerId });
    }

    const component = this;
    const player = window.jwplayer(this.videoRef);
    if (!player || !('setup' in player)) {
      // this player ref may have been destroyed already
      return;
    }

    const playerOpts = getPlayerOpts(this.props);

    // eslint-disable-next-line no-console
    console.log('_initialize player instance: ', player);
    console.log('_initialize videoRef instance: ', this.videoRef);

    initialize({ component, player, playerOpts });
  }
  _setVideoRef(element) {
    console.log('_setVideoRef: ', element);
    this.videoRef = element;
  }
  render() {
    return (
      <div className={this.props.className} >
        <div id={this.props.playerId} ref={this._setVideoRef} />
      </div>
    );
  }
}

ReactJWPlayer.defaultProps = defaultProps;
ReactJWPlayer.displayName = displayName;
ReactJWPlayer.propTypes = propTypes;
export default ReactJWPlayer;
