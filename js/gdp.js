class Gdp {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 60, left: 40};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.x = d3.scaleBand()
            .domain(vis.data.map(function (d) { return d.CountryName}))
            .range([vis.margin.left, vis.width])

        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.GDP)])
            .range([vis.height, 0]);

        vis.svg.selectAll(".bar")
            .data(vis.data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) {
                return vis.x(d.CountryName)
            })
            .attr("y", function (d) {
                return vis.y(d.GDP)
            })
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d.GDP))
            .attr("fill", "sandybrown");

        var xAxis = d3.axisBottom()
            .scale(vis.x)

        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (vis.height) + ")")
            .call(xAxis);

        var yAxis = d3.axisLeft()
            .scale(vis.y)

        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .attr("transform", "translate(" + vis.margin.left + ",0)")
            .call(yAxis);

        vis.svg.append("g")
            .attr("transform","translate("+[vis.margin.left, vis.margin.top]+")");

        var globalGDP = 13664

        vis.svg.append("line")
            .attr("x1", vis.margin.left)
            .attr("x2", vis.width)
            .attr("y1", function(){ return vis.y(globalGDP)})
            .attr("y2", function(){ return vis.y(globalGDP)})
            .attr("stroke-width", 2)
            .attr("stroke", "white")
            .attr("stroke-dasharray", "5,5");

        vis.svg.append("text")
            .attr("x", vis.width - 10)
            .attr("y", vis.y(globalGDP) - 5)
            .attr("text-anchor", "end")
            .style("fill", "white")
            .style("font-size", "12px")
            .text("Global Average GDP Per Capita");
    }
}