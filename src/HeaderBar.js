import React from 'react';
import{ Button } from '@blueprintjs/core';
import './HeaderBar.css';

export default class HeaderBar extends React.Component {

    render() {
        return <div className="headerbar-panel">
            <Button onClick={this.props.onStartStream}>Start data stream</Button>
        </div>;
    }
}

