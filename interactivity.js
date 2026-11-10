const cruiseData = [
    { ship: "Norwegian Dawn", line: "Norwegian", cruises: 1 },
    { ship: "Carnival Venezia", line: "Carnival", cruises: 2 },
    { ship: "Norwegian Star", line: "Norwegian", cruises: 1 },
    { ship: "Norwegian Gem", line: "Norwegian", cruises: 2 },
    { ship: "Anthem of the Seas", line: "Royal Caribbean", cruises: 1 },
    { ship: "Norwegian Bliss", line: "Norwegian", cruises: 1 },
    { ship: "Oasis of the Seas", line: "Royal Caribbean", cruises: 1 },
    { ship: "Liberty of the Seas", line: "Royal Caribbean", cruises: 1 },
    { ship: "Symphony of the Seas", line: "Royal Caribbean", cruises: 3 },
    { ship: "Norwegian Aqua", line: "Norwegian", cruises: 1 }
];

const cruiseLines = ["Royal Caribbean", "Carnival", "Norwegian"];

const sorters = {
    count: (a, b) => b.cruises - a.cruises || a.ship.localeCompare(b.ship),
    name: (a, b) => a.ship.localeCompare(b.ship),
    line: (a, b) => cruiseLines.indexOf(a.line) - cruiseLines.indexOf(b.line) || a.ship.localeCompare(b.ship)
};

function drawCruiseChart() {
    const margin = { top: 50, right: 30, bottom: 45, left: 160 };
    const rowHeight = 34;
    const width = 620 - margin.left - margin.right;
    const height = cruiseData.length * rowHeight;
    const duration = 500;

    const state = { sort: "count" };

    const container = d3.select("#d3-chart");

    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("role", "img")
        .attr("aria-label", "Horizontal bar chart of how many times I have sailed on each cruise ship, colored by cruise line")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const color = d3.scaleOrdinal()
        .domain(cruiseLines)
        .range(["#0f7b8a", "#14283a", "#e0a526"]);

    const maxCruises = d3.max(cruiseData, d => d.cruises);
    const x = d3.scaleLinear()
        .domain([0, maxCruises])
        .range([0, width]);

    // Bars are placed by row index in the current sort order
    const barHeight = rowHeight * 0.7;
    const rowY = i => i * rowHeight + (rowHeight - barHeight) / 2;

    // X axis (whole numbers only)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(maxCruises).tickFormat(d3.format("d")));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 38)
        .text("Number of cruises");

    const labelLayer = svg.append("g");
    const barLayer = svg.append("g");

    // Static legend across the top
    const legend = svg.append("g").attr("transform", "translate(-150, -38)");
    cruiseLines.forEach((line, i) => {
        const item = legend.append("g")
            .attr("transform", `translate(${i * 175}, 0)`);

        item.append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", color(line));

        item.append("text")
            .attr("class", "legend-label")
            .attr("x", 20)
            .attr("y", 12)
            .text(line);
    });

    const tooltip = container.append("div").attr("class", "tooltip");

    function update() {
        const visible = [...cruiseData].sort(sorters[state.sort]);
        const rank = new Map(visible.map((d, i) => [d.ship, i]));

        // Sort buttons
        d3.selectAll(".sort-btn")
            .classed("active", function () { return this.dataset.sort === state.sort; })
            .attr("aria-pressed", function () { return String(this.dataset.sort === state.sort); });

        // Ship name labels
        labelLayer.selectAll("text.ship-label")
            .data(visible, d => d.ship)
            .join(
                enter => enter.append("text")
                    .attr("class", "ship-label")
                    .attr("text-anchor", "end")
                    .attr("x", -10)
                    .attr("y", d => rowHeight / 2 + rowHeight * rank.get(d.ship))
                    .attr("dy", "0.35em")
                    .attr("opacity", 0)
                    .text(d => d.ship),
                update => update,
                exit => exit.transition().duration(duration / 2).attr("opacity", 0).remove()
            )
            .transition().duration(duration)
            .attr("opacity", 1)
            .attr("y", d => rowHeight / 2 + rowHeight * rank.get(d.ship));

        // Bars
        barLayer.selectAll("rect.bar")
            .data(visible, d => d.ship)
            .join(
                enter => enter.append("rect")
                    .attr("class", "bar")
                    .attr("x", 0)
                    .attr("y", d => rowY(rank.get(d.ship)))
                    .attr("height", barHeight)
                    .attr("width", 0)
                    .attr("fill", d => color(d.line))
                    .on("mouseover", (_, d) => {
                        const word = d.cruises === 1 ? "cruise" : "cruises";
                        tooltip.style("opacity", 1)
                            .text(`${d.ship} (${d.line}): ${d.cruises} ${word}`);
                    })
                    .on("mousemove", event => {
                        const box = document.getElementById("d3-chart").getBoundingClientRect();
                        tooltip
                            .style("left", (event.clientX - box.left + 12) + "px")
                            .style("top", (event.clientY - box.top - 30) + "px");
                    })
                    .on("mouseout", () => tooltip.style("opacity", 0)),
                update => update,
                exit => exit.transition().duration(duration / 2).attr("width", 0).remove()
            )
            .transition().duration(duration)
            .attr("y", d => rowY(rank.get(d.ship)))
            .attr("width", d => x(d.cruises));
    }

    d3.selectAll(".sort-btn").on("click", function () {
        state.sort = this.dataset.sort;
        update();
    });

    update();
}

drawCruiseChart();
