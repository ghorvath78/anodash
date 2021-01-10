import React from 'react';
import './AnoDashApp.css';
import RadarPlot from './RadarPlot';
import HeaderBar from './HeaderBar';
import { NonIdealState } from '@blueprintjs/core';
import MultiTimeSeriesPlot from './MultiTimeSeriesPlot';
import RelationGraph from './RelationGraph';
import RelationPlot from './RelationPlot';

export default class AnoDashApp extends React.Component {

    constructor(props) {
        super(props);

        this.values = [
            {"alma": 2.1, "körte": 3.3, "barack": 6.5, "meggy": -0.2, "szilva": 0.1, "narancs": 12.2},
            {"alma": 1.9, "körte": 2.0, "barack": 6.9, "meggy": 0.9, "szilva": 0.5, "narancs": 10.2},
            {"alma": 1.8, "körte": 1.0, "barack": 6.3, "meggy": 1.4, "szilva": 1.6, "narancs": 8.0},
            {"alma": 2.0, "körte": 1.2, "barack": 5.9, "meggy": 0.0, "szilva": 2.5, "narancs": 14.7}
        ];

        this.state = { phase: 0, currentMessage: null };
        this.data = [];
    }

    putData(data) {
        this.data.push(data);
        while (this.data.length > data.window)
            this.data.shift();
//        if (data.observed)
//            console.log(data);
        this.setState({currentMessage: data});
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

    handleRelationClick(var1, var2) {

        console.log("Clicked: ", var1, " - ", var2);
        const message = {
            command: "observe",
            var1: var1,
            var2: var2
        };
        this.server.send(JSON.stringify(message));
    }

    render() {
        return <>
            <HeaderBar onStartStream={() => this.handleStartStream()} />
            <div className="AnoDashApp">
                <div className="anodash-line">
                    <div className="anodash-radar-container">
                        {this.state.currentMessage && <RadarPlot 
                            point={this.state.currentMessage}
                            ticks={[0.00, 0.25, 0.50, 0.75, 1.00]}
                        />}
                        {!this.state.currentMessage && <NonIdealState title="No data received yet"  description="Connect to the server and start streaming to watch the radar chart" icon="polygon-filter"/>}
                    </div>
                    <div className="anodash-graph-container">
                        {this.state.currentMessage?.relations && <RelationGraph graph={this.state.currentMessage} onRelationClicked={(v1, v2) => this.handleRelationClick(v1, v2)} />}
                        {!(this.state.currentMessage?.relations) && <NonIdealState title="No graph available yet"  description="Start streaming and wait till the relation graph arrives" icon="layout"/>}                        
                    </div>
                </div>
                <div className="anodash-line">
                    <div className="anodash-timeplot-container">
                        {this.state.currentMessage && <MultiTimeSeriesPlot buffer={this.data} />}
                        {!this.state.currentMessage && <NonIdealState title="No data received yet"  description="Connect to the server and start streaming to watch the time series plot" icon="timeline-area-chart"/>}
                    </div>
                    <div className="anodash-relplot-container">
                        {this.state.currentMessage && <RelationPlot buffer={this.data} />}
                        {!this.state.currentMessage && <NonIdealState title="No relation selected"  description="Click an edge in the graph to watch the relation density plot" icon="regression-chart"/>}
                    </div>
                </div>
            </div>
            </>;
    }
}
