import React from 'react';
import './MultiTimeSeriesPlot.css';
import * as d3 from "d3";
import { lineChunked } from "d3-line-chunked";

export default class MultiTimeSeriesPlot extends React.Component {

    canvas = React.createRef();
    
    constructor(props) {
        super(props);

        this.cfg = {
            plotWidth: 1500,
            plotHeight: 64,
        };        
    }

    componentDidMount() {
        this.initGraph();
        this.drawGraph();
    }

    componentDidUpdate() {
        this.drawGraph();
    }

    initGraph() {

        this.svgCanvas = d3.select(this.canvas.current)
            .append("svg")
            .style("width", "100%");
        this.plotArea = this.svgCanvas.append("g");
        this.yAxis = this.plotArea.append("g");            
        this.xAxis = this.plotArea.append("g");            
    }

    drawGraph() {

        const last = this.props.buffer[this.props.buffer.length-1].sample;
        const variables = Object.keys(last);
        const N = variables.length;
        const height = N * this.cfg.plotHeight;
        const W = this.props.buffer[this.props.buffer.length-1].window;

        // y axis
        const yName = d3.scaleBand()
            .domain(variables)
            .range([0, height-this.cfg.plotHeight])
            .paddingInner(1)       
        this.yAxis
            .call(d3.axisLeft(yName));
        const yLabelWidth = this.yAxis.node().getBBox().width;

        // x axis
        const  x = d3.scaleLinear()
            .domain([0, W])
            .range([0, this.cfg.plotWidth]);        
        this.xAxis
            .attr("transform", "translate(0," + (height - this.cfg.plotHeight) + ")")
            .call(d3.axisBottom(x));
        const xLabelHeight = this.xAxis.node().getBBox().height;

        // adjust height and margins
        this.plotArea.attr("transform", "translate(" + yLabelWidth + "," + this.cfg.plotHeight + ")");            
        this.svgCanvas.attr("viewBox", "0 0 " + (this.cfg.plotWidth + yLabelWidth) + " " + (height + xLabelHeight));

        // render curves
        const lineData = [];
        for (const vr of variables) {
            const upper = this.props.buffer[this.props.buffer.length-1].quantile90[vr];
            const lower = this.props.buffer[this.props.buffer.length-1].quantile10[vr];
            const thisLineData = [{x: 0, y: lower, upper: upper, lower: lower}];
            for (let i = 0; i < this.props.buffer.length; i++)
                thisLineData.push({x: i, y: this.props.buffer[i].sample[vr], upper: upper, lower: lower});
            thisLineData.push({x: this.props.buffer.length-1, y: lower, upper: upper, lower: lower});
            lineData.push(thisLineData);
        }

        const line = lineChunked()            
            .x(d => d.x/W*this.cfg.plotWidth)
            .y(d => d.upper > d.lower ? (d.y - d.lower) / (d.upper - d.lower) * this.cfg.plotHeight : 0)
            .curve(d3.curveNatural);
        const curveSelection = this.plotArea
            .selectAll(".curve")
            .data(lineData);
        const curveEntering = curveSelection
            .enter()
            .append("g")
            .attr("class", "curve");
        curveSelection.merge(curveEntering)
            .attr("transform", (d, i) => "translate(0," + (i*this.cfg.plotHeight) +") scale(1,-1)")
            .call(line);
        curveSelection.exit().remove();
    }

    render() {
        return <div className="multitsplot-main">
            <div className="multitsplot-container" ref={this.canvas}>
            </div>
        </div>;
    }
}
