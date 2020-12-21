import React from 'react';
import './AnoDashApp.css';
import './RadarPlot';
import RadarPlot from './RadarPlot';

export default class AnoDashApp extends React.Component {

    constructor(props) {
        super(props);

        this.values = [
            {"alma": 2.1, "körte": 3.3, "barack": 6.5, "meggy": -0.2, "szilva": 0.1, "narancs": 12.2},
            {"alma": 1.9, "körte": 2.0, "barack": 6.9, "meggy": 0.9, "szilva": 0.5, "narancs": 10.2},
            {"alma": 1.8, "körte": 1.0, "barack": 6.3, "meggy": 1.4, "szilva": 1.6, "narancs": 8.0},
            {"alma": 2.0, "körte": 1.2, "barack": 5.9, "meggy": 0.0, "szilva": 2.5, "narancs": 14.7}
        ];

        this.state = { phase: 0 };
    }

    render() {
        return <div className="AnoDashApp">
                <div className="radar-container">
                    <RadarPlot 
                        point={this.values[this.state.phase]}
                        limits={{"alma": [0.0, 4.0], "körte": [0.0, 4.0], "barack": [0.0, 8.0], "meggy": [-1.0, 3.0], "szilva": [0.0, 3.0], "narancs": [0.0, 15.0]}}
                        ticks={[0.00, 0.25, 0.50, 0.75, 1.00]}
                    />
                </div>
                <button type="button" onClick={() => {this.setState(state => ({phase: Math.max(0, state.phase-1)})); }} > Prev </button>
                <button type="button" onClick={() => {this.setState(state => ({phase: Math.min(this.values.length-1, state.phase+1)})); }} > Next </button>
            </div>;
    }
}

