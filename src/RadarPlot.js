import React from 'react';
import './RadarPlot.css';
import * as d3 from "d3";

export default class RadarPlot extends React.Component {

    canvas = React.createRef();
    
    constructor(props) {
        super(props);

        this.cfg = {
            r: 300,
            maxFactor: 0.6,
            minFactor: 0.15
        };        
    }

    componentDidMount() {
        this.initRadar();
        this.drawRadar();
    }

    componentDidUpdate() {
        this.drawRadar();
    }

    initRadar() {

        this.svgCanvas = d3.select(this.canvas.current)
            .append("svg")
            .style("width", "100%")
            .attr("viewBox", (-this.cfg.r)+" "+(-this.cfg.r)+" "+(2*this.cfg.r)+" "+(2*this.cfg.r))

        this.rawPlot = this.svgCanvas.append("g").append("path").attr("class", "rawplot");
        this.axis = this.svgCanvas.append("g").attr("class", "axis");
        this.ticks = this.svgCanvas.append("g").attr("class", "ticks");
    }

    drawRadar() {
    
        const vars = this.props.point.variables.map(d => d.name);
        const N = vars.length;
        const startRad = this.cfg.r*this.cfg.minFactor;
        const endRad = this.cfg.r*this.cfg.maxFactor;
        const minTick = Math.min(...this.props.ticks);
        const maxTick = Math.max(...this.props.ticks);

        // render radial axes
        this.axis.selectAll(".line")
            .data(vars)
            .enter()
            .append("line")
            .attr("x1", (d, i) => startRad*Math.cos(i*2*Math.PI/N))
            .attr("y1", (d, i) => startRad*Math.sin(i*2*Math.PI/N))
            .attr("x2", (d, i) => endRad*Math.cos(i*2*Math.PI/N))
            .attr("y2", (d, i) => endRad*Math.sin(i*2*Math.PI/N))
            .attr("class", "line");
        this.axis.selectAll(".line")
            .data(vars)
            .exit()
            .remove();

        // render axis labels
        this.axis.selectAll(".text")
            .data(vars)
            .enter()
            .append("text")
    	    .attr("class", "text")
    	    .text((d,i) => d + " - " + i)
    	    .attr("alignment-baseline", "middle")
            .attr("transform", (d,i) => "rotate("+(i*360.0/N)+") translate("+(endRad*1.05)+", 0)");
        this.axis.selectAll(".text")
            .data(vars)
            .exit()
            .remove();

        // render axis ticks
        const axisLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .angle( (d,i) => i*2*Math.PI/N + Math.PI/2)
            .radius( d => startRad + (endRad-startRad)/(maxTick-minTick)*(d-minTick));
        const axisSelection = this.ticks.selectAll("path")
            .data(this.props.ticks)
            .attr("d", d => axisLine(new Array(N).fill(d)))
            .attr("class", "line");
    	axisSelection.enter()
    	    .append("path")
            .attr("d", d => axisLine(new Array(N).fill(d)))
            .attr("class", "line");

        // render point
        const line = d3.lineRadial()
            .curve(d3.curveLinearClosed)
	        .angle( (d,i) => i*2*Math.PI/N + Math.PI/2)
            .radius( d => startRad + (d.percentile95 !== d.percentile05 ? (endRad-startRad)/(d.percentile95-d.percentile05)*(d.value - d.percentile05) : 0) );
        this.rawPlot.transition().duration(100).attr("d", line(this.props.point.variables));
    }

    render() {
        return <div className="radarplot-main" ref={this.canvas}>
        </div>;
    }
}

RadarPlot.defaultProps = {
    lineColor: "rgb(0,0,0)",
    fontColor: "rgb(0,0,0)",
}