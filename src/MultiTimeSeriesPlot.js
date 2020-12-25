import React from 'react';
import './MultiTimeSeriesPlot.css';
import * as d3 from "d3";

export default class MultiTimeSeriesPlot extends React.Component {

    canvas = React.createRef();
    
    constructor(props) {
        super(props);

        this.cfg = {
            plotWidth: 750,
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
        this.plotArea.selectAll("rect")
            .data(Object.keys(last))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => (i-1)*this.cfg.plotHeight)
            .attr("width", this.cfg.plotWidth)
            .attr("height", this.cfg.plotHeight)
            .attr("class", "rect");
    }

    render() {
        return <div className="multitsplot-main">
            <div className="multitsplot-container" ref={this.canvas}>
            </div>
        </div>;
    }
}
