import React from 'react';
import './AnoDashApp.css';
import RadarPlot from './RadarPlot';
import HeaderBar from './HeaderBar';
import { NonIdealState } from '@blueprintjs/core';

export default class AnoDashApp extends React.Component {

    constructor(props) {
        super(props);

        this.values = [
            {"alma": 2.1, "körte": 3.3, "barack": 6.5, "meggy": -0.2, "szilva": 0.1, "narancs": 12.2},
            {"alma": 1.9, "körte": 2.0, "barack": 6.9, "meggy": 0.9, "szilva": 0.5, "narancs": 10.2},
            {"alma": 1.8, "körte": 1.0, "barack": 6.3, "meggy": 1.4, "szilva": 1.6, "narancs": 8.0},
            {"alma": 2.0, "körte": 1.2, "barack": 5.9, "meggy": 0.0, "szilva": 2.5, "narancs": 14.7}
        ];

        this.state = { phase: 0, current: null };
        this.data = [];
    }

    putData(data) {
        this.data.push(data);
        while (data.length > data.window)
            data.shift();
        this.setState({current: data});
    }

    handleStartStream() {
        console.log("start");
        this.data = [];
        this.server = new WebSocket("ws://localhost:8880");
        this.server.onopen = () => {
            console.log("connection open");
            const message = {
                command: "playDataSet",
                sampleDelay: "0.25"
            };
            this.server.send(JSON.stringify(message));
            console.log("message sent: ", message);
          };
        this.server.onmessage = (event) => this.putData(JSON.parse(event.data));
    }

    render() {
        return <>
            <HeaderBar onStartStream={() => this.handleStartStream()} />
            <div className="AnoDashApp">
                <div className="anodash-line">
                    <div className="anodash-radar-container">
                        {this.state.current && <RadarPlot 
                            point={this.state.current?.sample}
                            lowerLimit={this.state.current?.quantile10}
                            upperLimit={this.state.current?.quantile90}
                            ticks={[0.00, 0.25, 0.50, 0.75, 1.00]}
                        />}
                        {!this.state.current && <NonIdealState title="No data received yet"  description="Connect to the server and start streaming to watch the radar chart" icon="polygon-filter"/>}
                    </div>
                    <div className="anodash-graph-container">
                        {!this.state.current && <NonIdealState title="No graph available yet"  description="Start streaming and wait to see the relation graph" icon="layout"/>}
                    </div>
                </div>
                <div className="anodash-line">
                    <div className="anodash-timeplot-container">
                        {!this.state.current && <NonIdealState title="No data received yet"  description="Connect to the server and start streaming to watch the time series plot" icon="timeline-area-chart"/>}
                    </div>
                    <div className="anodash-relplot-container">
                        {!this.state.current && <NonIdealState title="No relation selected"  description="Click an edge in the graph to watch the relation density plot" icon="regression-chart"/>}
                    </div>
                </div>
            </div>
            </>;
    }
}
