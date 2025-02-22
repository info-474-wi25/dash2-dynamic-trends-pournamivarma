// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_RENAME = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_RENAME = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create SVG container for the bar chart
const svgBar = d3.select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Dropdown menu for selecting the type of precipitation
const dropdown = d3.select("#dropdownMenu")
    .append("select")
    .attr("id", "precipitationType")
    .on("change", updateChart);

// Options for the dropdown menu
const options = ["Record Precipitation", "Actual Precipitation", "Average Precipitation"];
dropdown.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(d => d);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("weather.csv").then(data => {
    // console.log(data)
    // 2.b: ... AND TRANSFORM DATA

    // Parse chart 1 data

    
    // Parse chart 2 data
    data.forEach(d => {
        d.year = d.year; // Keep year as string in "Month of Date, Year" format
        d.record_precipitation = +d.record_precipitation;
        d.actual_precipitation = +d.actual_precipitation;
        d.average_precipitation = +d.average_precipitation;
    });

    // 3.a: SET SCALES FOR CHART 1


    // 4.a: PLOT DATA FOR CHART 1


    // 5.a: ADD AXES FOR CHART 1


    // 6.a: ADD LABELS FOR CHART 1


    // 7.a: ADD INTERACTIVITY FOR CHART 1
    

    // ==========================================
    //         CHART 2 
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2
    const x2 = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.actual_precipitation)])
        .range([height, 0]);

    // 4.b: PLOT DATA FOR CHART 2
    svg2_RENAME.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x2(d.year) + x2.bandwidth() / 2)
            .y(d => y2(d.actual_precipitation))
        );

    // 5.b: ADD AXES FOR CHART 2
    svg2_RENAME.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2));

    svg2_RENAME.append("g")
        .call(d3.axisLeft(y2));

    // 6.b: ADD LABELS FOR CHART 2
    svg2_RENAME.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + 20)
        .text("Month of Date");

    svg2_RENAME.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top)
        .text("Actual Precipitation");

    // 7.b: ADD INTERACTIVITY FOR CHART 2
    svg2_RENAME.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x2(d.year) + x2.bandwidth() / 2)
        .attr("cy", d => y2(d.actual_precipitation))
        .attr("r", 3)
        .attr("fill", "red")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
                .attr("r", 6)
                .attr("fill", "orange");
            // Tooltip code can be added here
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
                .attr("r", 3)
                .attr("fill", "red");
            // Tooltip code can be added here
        });

    // Set scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    // Add axes
    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svgBar.append("g")
        .attr("class", "y-axis");

    // Initial chart update
    updateChart();

    function updateChart() {
        const selectedOption = d3.select("#precipitationType").property("value");
        let yValue;

        if (selectedOption === "Record Precipitation") {
            yValue = "record_precipitation";
        } else if (selectedOption === "Actual Precipitation") {
            yValue = "actual_precipitation";
        } else {
            yValue = "average_precipitation";
        }

        y.domain([0, d3.max(data, d => d[yValue])]);

        svgBar.select(".y-axis")
            .transition()
            .call(d3.axisLeft(y));

        const bars = svgBar.selectAll(".bar")
            .data(data, d => d.year);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year))
            .attr("width", x.bandwidth())
            .attr("y", height)
            .attr("height", 0)
            .merge(bars)
            .transition()
            .attr("x", d => x(d.year))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d[yValue]))
            .attr("height", d => height - y(d[yValue]));

        bars.exit()
            .transition()
            .attr("y", height)
            .attr("height", 0)
            .remove();
    }
});