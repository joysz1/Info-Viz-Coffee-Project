let gdpChart
let exportMap

let promises = [
    d3.csv('data/coffeecountriesgdp.csv', d => {
        d.GDP = +d.GDP
        return d;
    }),
    d3.csv('data/coffeeexports.csv', d => {
        d.TradeValue = +d.TradeValue
        return d;
    }),
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );


function initMainPage(allDataArray) {
        gdpChart = new Gdp("gdpChart", allDataArray[0]);
        exportMap = new CoffeeBelt('exportMap', allDataArray[1], allDataArray[2]);
}