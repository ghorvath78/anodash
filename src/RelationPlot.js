import React from 'react';
import Plot from 'react-plotly.js';
import './RelationPlot.css';
import ReactResizeDetector from "react-resize-detector";

export default class RelationPlot extends React.Component {
    
    constructor(props) {
        super(props);
        this.container = React.createRef();
        this.state = {lastObservedData: {}};      
    }

    componentDidMount() {
        this.initPlot();
        this.updatePlot();
    }

    componentDidUpdate() {
        this.updatePlot();
    }

    initPlot() {
    }

    updatePlot() {
        // get last plot data of the observed relation
        let lastRelplot = null;
        if (this.props.buffer) {
            for (let i=this.props.buffer.length-1; i>=0; i--)
                if (this.props.buffer[i].observed) {
                    lastRelplot = this.props.buffer[i];
                    break;
                }
            if (lastRelplot && lastRelplot !== this.state.lastObservedData) {
                this.setState({lastObservedData: lastRelplot})
            }
        }
    }

    normalizeMatrix(mx) {
        const minValue = Math.min.apply(null, mx.map(d => Math.min.apply(null, d)));
        const maxValue = Math.max.apply(null, mx.map(d => Math.max.apply(null, d)));
        return mx.map(row => row.map(d => (d-minValue)/(maxValue-minValue)));        
    }

    render() {
        const data = [], layout = { width: this.state.width, height: this.state.height };
        if (this.state.lastObservedData.observed) {
            data.push({
                x: this.state.lastObservedData.observed.xAxis,
                y: this.state.lastObservedData.observed.yAxis,
                z: this.state.lastObservedData.observed.values,
                type: "heatmap",
                colorscale: 'Portland'
            });
            const var1 = this.props.buffer[this.props.buffer.length-1].variables.find(d=>d.name===this.state.lastObservedData.observed["var1"]);
            const var2 = this.props.buffer[this.props.buffer.length-1].variables.find(d=>d.name===this.state.lastObservedData.observed["var2"]);
            if (var1 && var2) {
                data.push({
                    x: [var1.value],
                    y: [var2.value],
                    type: "scatter",
                    marker: {symbol: "x", size: 16, color: "white", line: {color: "black", width: 1.5}},
                });
                layout["title"] = `${var1.name} - ${var2.name}`;                
                layout["xaxis"] = { range: [Math.min.apply(null, this.state.lastObservedData.observed.xAxis), Math.max.apply(null, this.state.lastObservedData.observed.xAxis)], title: var1.name };
                layout["yaxis"] = { range: [Math.min.apply(null, this.state.lastObservedData.observed.yAxis), Math.max.apply(null, this.state.lastObservedData.observed.yAxis)], title: var2.name };
            }
        }
        
        return <div className="relationplot-main" ref={this.container}>
            <ReactResizeDetector handleHeight handleWeight targetRef={this.container} onResize={(w,h) => { this.setState({width: w, height: h}); }}>
                <Plot                    
                    className="relationplot-plot"
                    data={data}
                    layout={layout}
                    frames={[]}
                    config={{}}
                    onInitialized={figure => { return }}
                    onUpdate={figure => { return }}
                />
            </ReactResizeDetector>
        </div>;
    }
}
