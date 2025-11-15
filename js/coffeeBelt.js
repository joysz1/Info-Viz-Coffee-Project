class CoffeeBelt {
    constructor(parentElement, data, mapData) {
        this.parentElement = parentElement;
        this.data = data;
        this.mapData = mapData;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0]);

// compute bounds based only on non-Antarctica features
        let geo = topojson.feature(vis.mapData, vis.mapData.objects.countries);
        let filtered = geo.features.filter(d => d.properties.name !== "Antarctica");

        vis.projection.fitSize([vis.width, vis.height], { type: "FeatureCollection", features: filtered });

// Now restrict visible area to remove the bottom
        vis.projection.clipExtent([[0, 0], [vis.width, vis.height]]);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson
            .feature(vis.mapData, vis.mapData.objects.countries)
            .features
            .filter(d => d.properties.name !== "Antarctica");

        console.log(vis.mapData.objects);

        vis.svg.append('g')
            .selectAll('path')
            .data(vis.world)
            .enter()
            .append('path')
            .attr('d', vis.path)


        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);

        vis.tooltip = d3.select("body").append('div')
            .attr('class', 'tooltip')
            .attr('id', 'mapTooltip');

        vis.svg.append("defs")
            .append("pattern")
            .attr("id", "diagonalHatch")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 8)
            .attr("height", 8)
            .append("path")
            .attr("d", "M0,0 l8,8")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("opacity", "0.3");

        let startingLat = 30;
        let startingLng = -135;
        let endingLat = -20;
        let endingLng = 175;

        let startingCord = vis.projection([startingLng, startingLat]);
        let endingCord = vis.projection([endingLng, endingLat]);

        let rectWidth = endingCord[0] - startingCord[0];
        let rectHeight = endingCord[1] - startingCord[1];

        console.log(rectHeight);

        vis.svg.append("rect")
            .attr("x", 0)
            .attr("y", startingCord[1])
            .attr("width", vis.width)
            .attr("height", rectHeight)
            .attr("fill", "rgba(255, 0, 0, 0.2)")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("fill", "url(#diagonalHatch)")
            .attr("pointer-events", "none");

        vis.svg.append("rect")
            .attr("x", 2)
            .attr("y", startingCord[1] - 18)
            .attr("width", 120)
            .attr("height", 18)
            .attr("fill", "black")

        vis.svg.append("text")
            .attr("x", 5)
            .attr("y", startingCord[1] - 5)
            .text("The \"Coffee Belt\"")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("font-family", "Playfair Display")
            .attr("fill", "lightgrey");

        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${vis.height - 80})`);

        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRgb('white', 'rgb(110, 65, 0)'))
            .domain([
                Math.log(1),
                Math.log(d3.max(vis.data, d => d.TradeValue))
            ]);

        let color = 0;
        let rectLength = vis.width / 60;
        let steps = 10;
        for (let i = 0; i < steps; i++) {
            vis.legend.append('rect')
                .attr('x', i * rectLength)
                .attr('y', 0)
                .attr('width', rectLength)
                .attr('height', vis.width / 20)
                .attr('fill', vis.colorScale(Math.log(color)));
            console.log(vis.colorScale(color));
            console.log(color)
            color += d3.max(vis.data, d => d.TradeValue) / 9;

            vis.legendMin = vis.legend.append("text")
                .attr("class", "legend-text")
                .attr("x", 0)
                .attr("y", vis.width / 20 + 15)
                .attr("text-anchor", "start")
                .text("0");

            vis.legendMax = vis.legend.append("text")
                .attr("class", "legend-text")
                .attr("x", (vis.width / 20) * 4)
                .attr("y", vis.width / 20 + 15)
                .attr("text-anchor", "end")
                .text(d3.max(vis.data, d => d.TradeValue));
        }

        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        vis.countryValues = {}
        vis.data.forEach(d => {
            vis.countryValues[d.Reporter] = d.TradeValue;
        });

        vis.updateData();
    }

    updateData() {
        let vis = this;

        vis.countries
            .attr('fill', d => {
                if (Number.isFinite(vis.countryValues[d.properties.name])) {
                    return vis.colorScale(Math.log(vis.countryValues[d.properties.name]));
                } else return 'black'
        })
            .on('mouseover', function (event, d) {
            if (Number.isFinite(vis.countryValues[d.properties.name])) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black')
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                         <h2>${d.properties.name}<h5>  
                         <h3>Exports: ${vis.countryValues[d.properties.name]}<h6>       
                    </div>`);
            }})
        .on('mouseout', function (event, d) {
            if (Number.isFinite(vis.countryValues[d.properties.name])) {
                d3.select(this)
                    .attr('stroke-width', '0.5px')
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            }})
        }

}