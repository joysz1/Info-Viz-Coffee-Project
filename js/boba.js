// Dual view: receipt summary <-> donut chart of price tiers
const PRICE_ORDER = ["$", "$$", "$$$", "$$$$"];
const COLORS = d3.scaleOrdinal()
  .domain(PRICE_ORDER)
  .range(["#a8d9a0", "#71d1d8", "#f4a24b", "#d0c4b9"]); // soft palette inspired by mock

function main(){
  d3.csv("data/boba.csv").then(raw => {
    raw.forEach(d => {
      d.price = d.price?.trim();
      d.city = d.city?.trim() || "Unknown";
    });

    // State
    let selectedCities = new Set(); // empty = all
    let measure = "count"; // 'count' | 'percent'
    let activeTier = null; // price tier selected

    // Build UI controls
    const cities = Array.from(new Set(raw.map(d => d.city))).sort((a,b)=>d3.ascending(a,b));
    const topCities = cities.slice(0, 30); // avoid UI overload
    const cityChips = d3.select("#city-chips");

    topCities.forEach(c => {
      cityChips.append("div").attr("class","chip").text(c)
        .on("click", function(){
          const on = selectedCities.has(c);
          if(on) selectedCities.delete(c); else selectedCities.add(c);
          d3.select(this).classed("on", !on);
          update();
        });
    });

    d3.select("#measure-toggle").selectAll("button").on("click", function(){
      d3.select("#measure-toggle").selectAll("button").classed("on", false);
      d3.select(this).classed("on", true);
      measure = this.dataset.m;
      update();
    });

    // Receipt
    const R = d3.select("#receipt");
    R.html("");
    R.append("div").attr("class","r-head").text("Boba Shops");
    R.append("div").attr("class","r-sub").text("Bay Area, California");
    R.append("div").attr("class","r-line");
    const rWrap = R.append("div").attr("id","r-rows");
    R.append("div").attr("class","r-line");
    const rFoot = R.append("div").attr("class","r-row").html(`<span>Total</span><strong id="totalTxt"></strong>`);

    // Donut
    const svg = d3.select("#donut").append("svg");
    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    const cx = W/2, cy = H/2, outer = Math.min(W,H)*0.36, inner = outer*0.6;
    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
    const arc = d3.arc().innerRadius(inner).outerRadius(outer).cornerRadius(10);
    const pie = d3.pie().sort(null).value(d => d.value);

    const tip = d3.select("body").append("div").attr("class","tooltip").style("opacity",0);

    const legend = d3.select(".panel.boba").append("div").attr("class","price-legend");
    PRICE_ORDER.forEach(p => {
      const it = legend.append("div").attr("class","legend-item");
      it.append("div").attr("class","swatch").style("background", COLORS(p));
      it.append("span").text(p);
    });

    function filtered(){
      return raw.filter(d => selectedCities.size===0 || selectedCities.has(d.city));
    }

    function summarize(data){
      const total = data.length;
      const map = d3.rollup(data, v=>v.length, d=>d.price);
      const arr = PRICE_ORDER.map(p => ({price: p, count: map.get(p) || 0}));
      arr.forEach(d => d.percent = total ? d.count/total : 0);
      return {total, arr};
    }

    function renderReceipt(summary){
      const rows = d3.select("#r-rows").selectAll(".r-row.price").data(summary.arr, d=>d.price);
      const fmtPct = d3.format(".0%");
      const fmtCount = d3.format(",");

      const enter = rows.enter().append("div").attr("class","r-row price")
        .on("click", (_,d)=>{ activeTier = (activeTier===d.price? null : d.price); update(true); });

      enter.append("span").html(d => `${d.price} Dollar Sign <span class="pill">tier</span>`);
      enter.append("strong");

      const merged = enter.merge(rows);
      merged.classed("active", d => d.price===activeTier)
            .classed("dim", d => activeTier && d.price!==activeTier);

      merged.select("strong")
        .text(d => measure==="count" ? `${fmtCount(d.count)}` : fmtPct(d.percent));

      rows.exit().remove();

      d3.select("#totalTxt").text(`${fmtCount(summary.total)} shops`);
    }

    function renderDonut(summary){
      const data = summary.arr.map(d => ({key:d.price, value: measure==="count" ? d.count : d.percent}));
      const arcs = g.selectAll("path.arc").data(pie(data), d=>d.data.key);

      arcs.enter().append("path")
        .attr("class","arc")
        .attr("fill", d => COLORS(d.data.key))
        .attr("d", arc)
        .style("cursor","pointer")
        .on("mousemove", (event,d) => {
          const raw = summary.arr.find(x => x.price===d.data.key);
          const pct = d3.format(".1%")(raw.percent);
          tip.style("opacity",1)
             .html(`<strong>${d.data.key}</strong><br/>${raw.count} shops<br/>${pct}`)
             .style("left", (event.pageX+12)+"px")
             .style("top",  (event.pageY-28)+"px");
        })
        .on("mouseleave", () => tip.style("opacity",0))
        .on("click", (_,d) => { activeTier = (activeTier===d.data.key? null : d.data.key); update(true); })
        .merge(arcs)
          .transition().duration(400)
          .attr("opacity", d => activeTier && d.data.key!==activeTier ? 0.45 : 1)
          .attr("d", arc);

      arcs.exit().remove();

      const labels = g.selectAll("text.slice-label").data(pie(data), d=>d.data.key);
      labels.enter().append("text").attr("class","slice-label")
        .attr("dy",".35em")
        .merge(labels)
          .transition().duration(400)
          .attr("opacity", d => (activeTier && d.data.key!==activeTier) ? 0.35 : 1)
          .attr("transform", d => `translate(${arc.centroid(d)})`)
          .text(d => d.data.key.replace(/\$/g,"$")); // keep as-is
      labels.exit().remove();

      // sync legend dimming
      d3.selectAll(".legend-item").classed("dim", function(_,i){
        const tier = PRICE_ORDER[i];
        return activeTier && tier!==activeTier;
      });
    }

    function update(skipAnim=false){
      const s = summarize(filtered());
      renderReceipt(s);
      renderDonut(s);
    }

    update();
  });
}

window.addEventListener("DOMContentLoaded", main);
