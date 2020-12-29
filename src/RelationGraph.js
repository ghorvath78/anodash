import React from 'react';
import './RelationGraph.css';
import * as d3 from "d3";
import ReactResizeDetector from "react-resize-detector";
import { Button } from '@blueprintjs/core';
import _ from "lodash";

export default class RelationGraph extends React.Component {

    canvas = React.createRef();
    
    constructor(props) {
        super(props);

        this.state = { width: 0, height: 0 };

        this.cfg = {
            plotWidth: 1500,
            plotHeight: 64,
        };        

        this.canvas = React.createRef();
        this.container = React.createRef();
        this.graph = null;
    }

    componentDidMount() {
        this.initGraph();
        this.drawGraph();
    }

    componentDidUpdate() {
        this.drawGraph();
    }

    initGraph() {

        const svgCanvas = d3.select("#graph-main-svg");
        const svgMain = d3.select("#graph-main-svg-content");
        svgMain.selectAll("*").remove();

        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("centerY", d3.forceY(0).strength(0.03))         
            .force("centerX", d3.forceX(0).strength(0.01));                

        this.links = svgMain.append("g").attr("class", "links");
        this.nodes = svgMain.append("g").attr("class", "nodes");

        if (!this.zoom_hander) {
            this.zoom_handler = d3.zoom().on("zoom", event => svgMain.attr("transform", event.transform));
            this.zoom_handler(svgCanvas);
        }

        this.colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0.0, 1.0]);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.graph !== nextProps.graph;
    }

    drawGraph() {

        if (!this.props.graph)
            return;

        this.mergeGraphs();

        let changed = 0;
        changed += this.links.selectAll("line")
            .data(this.graph.links, d => d.var1 + "-" + d.var2)
            .enter().append("line").size();
        changed += this.links.selectAll("line")
            .data(this.graph.links, d => d.var1 + "-" + d.var2)
            .exit().remove().size();

        const linkParts = this.links.selectAll("line")
            .data(this.graph.links, d => d.var1 + "-" + d.var2)
            .attr("stroke", d => this.colorScale(d.score))
            .attr("stroke-width", 3)
            .on("click", (event,d) => console.log(event, d));
            
        const newNodes = this.nodes.selectAll("g")
            .data(this.graph.nodes, d => d.var)
            .enter().append("g")
        changed += newNodes.size();

        newNodes.append("circle")
            .attr("r", 5)
            .attr("fill", "blue")
            .attr("stroke", "white")
            .call(d3.drag()
                .on("start", (event,d) => {
                    if (!event.active) 
                        this.simulation.alpha(0.5).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event,d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event,d) => {
                    if (!event.active) 
                        this.simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        newNodes.append("text")
            .text(d => d.var)
            .attr('x', 6)
            .attr('y', 3);

        newNodes.append("title")
            .text(d => d.var);

        changed += this.nodes.selectAll("g")
            .data(this.graph.nodes, d => d.var)
            .exit().remove()

        const nodeParts = this.nodes.selectAll("g")
            .data(this.graph.nodes, d => d.var)
  
        this.simulation.nodes(this.graph.nodes).on("tick", () => {
            linkParts
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);       
            nodeParts
                .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
        });  
        this.simulation.force("link").id(d => d.var).links(this.graph.links);

        if (changed > 0)
            this.restartSimulation();
    }

    restartSimulation() {
        this.simulation.alphaDecay(0.002).alpha(1.0).restart();
    }

    mergeGraphs() {
        this.props.graph.links.forEach(d => { d.source = d.var1; d.target = d.var2; });
        if (!this.graph)
            this.graph = this.props.graph;
        else {
            // update nodes and add new ones if necessary
            this.props.graph.nodes.forEach(d => {
                const hit = this.graph.nodes.find(n => n.var === d.var);
                if (!hit)
                    this.graph.nodes.push(d);
                else
                    hit.score = d.score;
            });
            // delete nodes that do not exist any more
            _.dropWhile(this.graph.nodes, d => !this.props.graph.nodes.find(n => n.var === d.var));
            // update links and add new ones if necessary
            this.props.graph.links.forEach(d => {
                const hit = this.graph.links.find(n => (n.var1 === d.var1 && n.var2 === d.var2) || (n.var1 === d.var2 && n.var2 === d.var1));
                if (!hit)
                    this.graph.links.push(d);
                else
                    hit.score = d.score;
            });
            // delete links that do not exist any more
            _.dropWhile(this.graph.links, d => !this.props.graph.links.find(n => (n.var1 === d.var1 && n.var2 === d.var2) || (n.var1 === d.var2 && n.var2 === d.var1)));
        }
    }

    render() {
        return <div className="relationgraph-container">
                <ReactResizeDetector handleHeight handleWeight targetRef={this.container} onResize={(w,h) => {                
                    this.setState({width: w, height: h});
                    this.forceUpdate();
                    }}>
                    <div className="relationgraph-main" ref={this.container}>
                        <svg id="graph-main-svg" width={this.state.width} height={this.state.height} viewBox={`${-this.state.width/2} ${-this.state.height/2} ${this.state.width} ${this.state.height}`}><g id="graph-main-svg-content"></g></svg> 
                    </div>
                </ReactResizeDetector>
                <div className="relationgraph-buttonbar">
                    <div><Button minimal="true" icon="refresh" onClick={() => this.restartSimulation()} /></div>
                </div>
            </div>;
    }
}
