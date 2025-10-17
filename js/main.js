let gdpChart

loadData();

function loadData() {
    //GDP data
    d3.csv("data/coffeecountriesgdp.csv", d => {
        d.GDP = +d.GDP;
        return d;
    }).then(function(data) {
        console.log("gdp data loaded")
        gdpChart = new Gdp("gdpChart", data)
        gdpChart.initVis()
    })
}