import React from 'react';
import './RelationGraph.css';
import * as d3 from "d3";

export default class RelationGraph extends React.Component {

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
            .style("width", "100%")
            .attr("viewBox", "-480 -300 960 600");      

        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter());                
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.graph !== nextProps.graph;
    }

    drawGraph() {

        if (!this.props.graph)
            return;

        this.svgCanvas.selectAll("g").remove();

        const link = this.svgCanvas.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(this.props.graph.links)
            .enter().append("line")
            .attr("stroke", "black")
            .attr("stroke-width", 1);      
  
        const node = this.svgCanvas.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(this.props.graph.nodes)
            .enter().append("g")
      
        node.append("circle")
            .attr("r", 5)
            .attr("fill", "blue")
            .call(d3.drag()
                .on("start", (event,d) => {
                    if (!event.active) 
                        this.simulation.alphaTarget(0.2).restart();
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

        node.append("text")
            .text(d => d.id)
            .attr('x', 6)
            .attr('y', 3);

        node.append("title")
            .text(d => d.id);
  
        this.simulation.nodes(this.props.graph.nodes).on("tick", ticked);  
        this.simulation.force("link").links(this.props.graph.links);
        this.simulation.alpha(0.5).restart();

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            node
                .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
        }
    }

    render() {
        return <div className="relationgraph-main">
            <div className="relationgraph-container" ref={this.canvas}>
            </div>
        </div>;
    }
}
