(function(){
    // ✏️ Your events (order matters)
    const events = [
        {
            year: 1828,
            title: "Caffeine isolated",
            blurb: "Friedlieb Runge isolates caffeine from coffee beans, paving the way for modern research.",
            img: "assets/timeline/Friedlieb_Ferdinand_Runge.jpeg",
            alt: "Friedlieb Runge",
            credit: "Portrait Wikimedia, public domain"
        },
        {
            year: 1886,
            title: "Coca-Cola launched",
            blurb: "Cola becomes a mass-market vehicle for caffeine in the U.S.",
            img: "assets/timeline/Coca-Cola_ad_1923.png",
            alt: "Print advertisement from 1923 showing a hand holding a bottle of Coca-Cola",
            credit: "The Elks Magazine 1923, public domain"
        },
        {
            year: 1901,
            title: "Instant coffee (Kato)",
            blurb: "Satori Kato patents a soluble coffee method that popularizes instant brews.",
            img: "assets/timeline/Kato_Coffee_Co.jpg",
            alt: "The title page of a brochure in the Pan-American Exposition, published by Kato Coffee Co",
            credit: "Pan-American Exposition, Public Domain"
        },
        {
            year: 1903,
            title: "Decaf process",
            blurb: "Ludwig Roselius pioneers a commercial decaffeination technique.",
            img: "assets/timeline/Ludwig_Roselius_by_Nicola_Perscheid_c1905.jpg",
            alt: "Ludwig Roselius Picture by Nicola Perscheid c1905 ",
            credit: "Nicola Perscheid, Public Domain"
        },
        {
            year: 1949,
            title: "Modern espresso machine",
            blurb: "High-pressure extraction (Cremonesi/Gaggia) becomes the cafe standard.",
            img: "assets/timeline/Espresso_Machine.jpg",
            alt: "Classic espresso machine engineering diagram",
            credit: "Smithsonian, CC 4.0"
        },
        {
            year: 1987,
            title: "Red Bull era",
            blurb: "Energy drinks go global, reframing caffeine as a performance boost.",
            img: "assets/timeline/Red_Bull_Car.JPG",
            alt: "Red bull car",
            credit: "This file is licensed under the Creative Commons Attribution-Share Alike 3.0 Unported license. ",
        },
        {
            year: 2008,
            title: "Boba goes mainstream",
            blurb: "Bubble tea chains expand rapidly in the U.S., especially on the West Coast.",
            img: "assets/timeline/Boba.JPG",
            alt: "tapioca pearls used for Boba",
            credit: "Creative Commons Attribution-Share Alike 4.0"
        },
        {
            year: 2015,
            title: "Cold brew wave",
            blurb: "Slow-steeped coffee becomes the new default in cafes and RTD bottles.",
            img: "assets/timeline/Stok_Cold_Brewed_Coffee.jpg",
            alt: "Stok Cold Brewed Coffee on store shelves",
            credit: "Mike Mozart from Funny YouTube, USA"
        }
    ];


    // Inject slides
    const slides = d3.select("#tlw-slides");
    slides.selectAll(".tlw-slide").data(events).enter()
        .append("div").attr("class","tlw-slide")
        .html(d => `
    <div class="tlw-card">
      <div class="tlw-media">
        <img src="${d.img}" alt="${d.alt || d.title}" loading="lazy" />
      </div>
      <div class="tlw-text">
        <div class="badge">${d.year}</div>
        <h3>${d.title}</h3>
        <p>${d.blurb}</p>
        ${d.credit ? `<div class="credit">Image: ${d.credit}</div>` : ""}
      </div>
    </div>
  `);

    // fade-in on load
    document.querySelectorAll(".tlw-media img").forEach(img => {
        if (img.complete) img.classList.add("is-loaded");
        else img.addEventListener("load", () => img.classList.add("is-loaded"));
    });



    // Build left spine
    const svg = d3.select("#tlw-svg");
    if (svg.empty()) return;

    const W = svg.node().clientWidth || 200;
    const H = svg.node().clientHeight || document.querySelector(".tlw-wrap").clientHeight;
    svg.attr("width", W).attr("height", H);

    const m = { top: 24, right: 10, bottom: 24, left: 24 };
    const innerH = H - m.top - m.bottom;
    const lineX = Math.round(W * 0.55);

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    g.append("line").attr("class","tlw-axis").attr("x1",lineX).attr("x2",lineX).attr("y1",0).attr("y2",innerH);

    // Evenly distribute dots down the column (window shows one at a time anyway)
    const y = d3.scalePoint().domain(d3.range(events.length)).range([0, innerH]).padding(0.5);

    const nodes = g.selectAll(".node").data(events).enter().append("g")
        .attr("class","node")
        .attr("transform", (_,i) => `translate(${lineX},${y(i)})`);

    nodes.append("circle").attr("class","tlw-dot").attr("r",6);
    nodes.append("text").attr("class","tlw-year").attr("x",-14).attr("dy","0.32em").text(d=>d.year);

    // Sync active dot with scroll
    const dotEls   = nodes.select(".tlw-dot").nodes();
    const yearEls  = nodes.select(".tlw-year").nodes();
    const slideEls = slides.selectAll(".tlw-slide").nodes();

    const setActive = (idx) => {
        dotEls.forEach(el => el.classList.remove("active"));
        yearEls.forEach(el => el.classList.remove("active"));
        slideEls.forEach(el => el.classList.remove("active"));
        if (idx>=0 && idx<events.length){
            dotEls[idx].classList.add("active");
            yearEls[idx].classList.add("active");
            slideEls[idx].classList.add("active");
        }
    };

    // IntersectionObserver to detect which slide is centered
    const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                const idx = slideEls.indexOf(entry.target);
                setActive(idx);
            }
        });
    }, { root: slides.node(), threshold: 0.6 }); // 60% in view

    slideEls.forEach(el => io.observe(el));
    setActive(0);

    // Click a dot → scroll to that slide
    nodes.on("click", (_, d, i) => {
        const idx = events.indexOf(d);
        slides.node().scrollTo({ top: idx * slides.node().clientHeight, behavior: 'smooth' });
    });

    // Buttons / keyboard
    const prevBtn = document.getElementById("tlw-prev");
    const nextBtn = document.getElementById("tlw-next");
    const go = (dir) => {
        const current = slideEls.findIndex(el => el.classList.contains("active"));
        const next = Math.max(0, Math.min(events.length-1, current + dir));
        slides.node().scrollTo({ top: next * slides.node().clientHeight, behavior: 'smooth' });
    };
    prevBtn?.addEventListener("click", () => go(-1));
    nextBtn?.addEventListener("click", () => go(1));
    slides.node().addEventListener("keydown", (e)=>{
        if(e.key === "ArrowDown") go(1);
        if(e.key === "ArrowUp") go(-1);
    });
})();
