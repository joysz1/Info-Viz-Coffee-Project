// caffeine.js — D3 v7 interactive horizontal bar chart
// CSV headers: drink,Volume (ml),Calories,Caffeine (mg),type
(function () {
    const CSV_PATH = "./data/caffeine.csv";

    const container   = d3.select("#caffeine-chart");
    const topNSelect  = d3.select("#caff-topn");
    const searchBox   = d3.select("#caff-search");
    if (container.empty()) return;

    // helpers
    const shorten = (s, n = 28) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

    // tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip").style("opacity", 0);

    let rawRows = [];
    let sortDesc = true; // keep if you want to wire a sort toggle later

    // layout
    const margin = { top: 20, right: 24, bottom: 44, left: 180 };
    let width, height, innerW, innerH;
    let svg, g, x, y, xAxisG, yAxisG;

    function setDims() {
        width  = container.node().clientWidth || 900;
        height = container.node().clientHeight || 560;
        innerW = width - margin.left - margin.right;
        innerH = height - margin.top - margin.bottom;
    }

    function initSVG() {
        container.selectAll("svg").remove();
        svg = container.append("svg").attr("width", width).attr("height", height);
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        x = d3.scaleLinear().range([0, innerW]);
        y = d3.scaleBand().range([0, innerH]).padding(0.15);

        xAxisG = g.append("g").attr("transform", `translate(0,${innerH})`);
        yAxisG = g.append("g");

        svg.append("text")
            .attr("x", margin.left + innerW / 2)
            .attr("y", height - 8)
            .attr("text-anchor", "middle")
            .attr("fill", "var(--muted)")
            .text("Caffeine (mg)");

        svg.append("text")
            .attr("x", 14)
            .attr("y", margin.top - 6)
            .attr("fill", "var(--muted)")
            .text("Drink");
    }

    // csv → canonical
    function parseRow(d) {
        return {
            drink: String(d["drink"] || "").trim(),
            mg: +d["Caffeine (mg)"],
            type: String(d["type"] || "").trim(),
            vol: +d["Volume (ml)"]
        };
    }

    // build series with search + TopN
    function buildSeries(rows) {
        const q    = (searchBox.node()?.value || "").trim().toLowerCase();
        const topN = +(topNSelect.node()?.value || 25);

        let filtered = rows.filter(r => r.drink && Number.isFinite(r.mg));
        if (q) filtered = filtered.filter(r => r.drink.toLowerCase().includes(q));

        let series = d3.rollups(filtered, v => d3.mean(v, d => d.mg), d => d.drink)
            .map(([drink, avg]) => ({ drink, avg }));

        series.sort((a, b) => sortDesc ? d3.descending(a.avg, b.avg) : d3.ascending(a.avg, b.avg));
        return series.slice(0, topN);
    }

    function render(series) {
        // auto-grow container: ~22px per bar
        const perBar = 22;
        const targetH = Math.max(260, perBar * series.length + margin.top + margin.bottom);
        container.style("height", `${targetH}px`);

        setDims();
        initSVG();

        x.domain([0, d3.max(series, d => d.avg) || 100]);
        y.domain(series.map(d => d.drink));

        // Bars
        g.selectAll(".bar")
            .data(series, d => d.drink)
            .join(
                enter => enter.append("rect")
                    .attr("class", "bar")
                    .attr("fill", "var(--accent)")
                    .attr("x", 0)
                    .attr("y", d => y(d.drink))
                    .attr("height", y.bandwidth())
                    .attr("width", 0)
                    .on("mousemove", (event, d) => {
                        const xPos = x(d.avg);
                        hoverRule
                            .attr("x1", xPos)
                            .attr("x2", xPos)
                            .style("opacity", 1)
                            .raise();

                        hoverLabel
                            .attr("x", xPos)
                            .text(`${d.avg.toFixed(0)} mg`)
                            .style("opacity", 1)
                            .raise();

                        tooltip
                            .style("opacity", 1)
                            .style("left", `${event.clientX}px`)
                            .style("top", `${event.clientY}px`)
                            .html(`<strong>${d.drink}</strong><br/>Avg: ${d.avg.toFixed(1)} mg`);
                    })
                    .on("mouseleave", () => {
                        tooltip.style("opacity", 0);
                        hoverRule.style("opacity", 0);
                        hoverLabel.style("opacity", 0);
                    })

                    .call(sel => sel.transition().duration(600).attr("width", d => x(d.avg))),
                update => update.transition().duration(400)
                    .attr("y", d => y(d.drink))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.avg)),
                exit => exit.transition().duration(300).attr("width", 0).remove()
            );

        // Axes with gridlines + short labels
        const xAxis = d3.axisBottom(x).ticks(Math.max(innerW / 80, 3)).tickSize(-innerH).tickSizeOuter(0);
        const yAxis = d3.axisLeft(y).tickFormat(d => shorten(d)).tickSizeOuter(0);

        xAxisG.attr("class", "axis x-axis").call(xAxis);
        yAxisG.attr("class", "axis y-axis").call(yAxis);

        // dark theme styling
        svg.selectAll(".axis text").style("fill", "var(--ink)");
        svg.selectAll(".axis path, .axis line").style("stroke", "var(--line)");
        svg.selectAll(".x-axis .tick line").style("opacity", 0.35);
        const hoverG = g.append("g").attr("class", "hover").style("pointer-events", "none");

        const hoverRule = hoverG.append("line")
            .attr("class", "hover-rule")
            .attr("y1", 0)
            .attr("y2", innerH);

        const hoverLabel = hoverG.append("text")
            .attr("class", "hover-label")
            .attr("y", innerH + 28); // sit just below the x-axis ticks
    }

    function refresh() {
        render(buildSeries(rawRows));
    }

    // load + wire controls
    d3.csv(CSV_PATH, parseRow).then(rows => {
        rawRows = rows;
        topNSelect.on("change", refresh);
        searchBox.on("input", () => {
            clearTimeout(searchBox._t);
            searchBox._t = setTimeout(refresh, 120);
        });
        refresh();
        window.addEventListener("resize", refresh);
    }).catch(err => console.error("CSV load error", err));
})();
