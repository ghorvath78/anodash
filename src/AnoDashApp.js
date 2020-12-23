import React from 'react';
import './AnoDashApp.css';
import RadarPlot from './RadarPlot';
import HeaderBar from './HeaderBar';

export default class AnoDashApp extends React.Component {

    constructor(props) {
        super(props);

        this.values = [
            {"alma": 2.1, "körte": 3.3, "barack": 6.5, "meggy": -0.2, "szilva": 0.1, "narancs": 12.2},
            {"alma": 1.9, "körte": 2.0, "barack": 6.9, "meggy": 0.9, "szilva": 0.5, "narancs": 10.2},
            {"alma": 1.8, "körte": 1.0, "barack": 6.3, "meggy": 1.4, "szilva": 1.6, "narancs": 8.0},
            {"alma": 2.0, "körte": 1.2, "barack": 5.9, "meggy": 0.0, "szilva": 2.5, "narancs": 14.7}
        ];

        //lower = {"alma": 0.0, "körte": 0.0, "barack": 0.0, "meggy": -1.0, "szilva": 0.0, "narancs": 0.0};
        //upper = {"alma": 4.0, "körte": 4.0, "barack": 8.0, "meggy": 3.0, "szilva": 3.0, "narancs": 15.0};

        this.state = { phase: 0, point: [], upper: [], lower: [] };
    }

    handleStartStream() {
        console.log("start");
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
        this.server.onmessage = (event) => {
            const point = JSON.parse(event.data);
            console.log(point);
            this.setState({point: point.sample, upper: point.quantile90, lower: point.quantile10});
        }
    }

    render() {
        return <>
            <HeaderBar onStartStream={() => this.handleStartStream()} />
            <div className="AnoDashApp">
                <div className="radar-container">
                    <RadarPlot 
                        point={this.state.point}
                        lowerLimit={this.state.lower}
                        upperLimit={this.state.upper}
                        ticks={[0.00, 0.25, 0.50, 0.75, 1.00]}
                    />
                </div>
                <button type="button" onClick={() => {this.setState(state => ({phase: Math.max(0, state.phase-1)})); }} > Prev </button>
                <button type="button" onClick={() => {this.setState(state => ({phase: Math.min(this.values.length-1, state.phase+1)})); }} > Next </button>
            </div>
            </>;
    }
}

//point={this.values[this.state.phase]}
//lowerLimit={{"alma": 0.0, "körte": 0.0, "barack": 0.0, "meggy": -1.0, "szilva": 0.0, "narancs": 0.0}}
//upperLimit={{"alma": 4.0, "körte": 4.0, "barack": 8.0, "meggy": 3.0, "szilva": 3.0, "narancs": 15.0}}
