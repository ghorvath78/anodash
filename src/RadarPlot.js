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
        console.log("mount", this.props);
        this.initRadar();
        this.drawRadar();
    }

    componentDidUpdate() {
        console.log("update", this.props);
        this.drawRadar();
    }

    initRadar() {

        this.svgCanvas = d3.select(this.canvas.current)
            .append("svg")
            .attr("width", "100%")
            .attr("viewBox", (-this.cfg.r)+" "+(-this.cfg.r)+" "+(2*this.cfg.r)+" "+(2*this.cfg.r))

//        this.svgCanvas.append("rect").attr("x", -this.cfg.r).attr("y", -this.cfg.r).attr("width", 2*this.cfg.r).attr("height", 2*this.cfg.r).attr("fill", "none").attr("stroke","black").attr("stroke-width", 2);
        this.rawPlot = this.svgCanvas.append("g").append("path").attr("class", "rawplot");
        this.axis = this.svgCanvas.append("g").attr("class", "axis");
        this.ticks = this.svgCanvas.append("g").attr("class", "ticks");
    }

    drawRadar() {
    
        const vars = Object.keys(this.props.point);
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
            .radius( d => startRad + (this.props.upperLimit[d[0]] !== this.props.lowerLimit[d[0]] ? (endRad-startRad)/(this.props.upperLimit[d[0]]-this.props.lowerLimit[d[0]])*(d[1] - this.props.lowerLimit[d[0]]) : 0) );
        this.rawPlot.transition().duration(100).attr("d", line(Object.entries(this.props.point)));
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