// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1 = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2 = d3.select("#lineChart2")
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


function updateChart() {
    if (!window.weatherData) return; // Ensure data is loaded
    const selectedOption = d3.select("#precipitationType").property("value");
    let yValue;

    if (selectedOption === "Record Precipitation") {
        yValue = "record_precipitation";
    } else if (selectedOption === "Actual Precipitation") {
        yValue = "actual_precipitation";
    } else {
        yValue = "average_precipitation";
    }

    y2.domain([0, d3.max(window.weatherData, d => d[yValue])]);

    svgBar.select(".y-axis")
        .transition()
        .call(d3.axisLeft(y2));

    const bars = svgBar.selectAll(".bar")
        .data(window.weatherData, d => d.year);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.year))
        .attr("width", x2.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .merge(bars)
        .transition()
        .attr("x", d => x2(d.year))
        .attr("width", x2.bandwidth())
        .attr("y", d => y2(d[yValue]))
        .attr("height", d => height - y2(d[yValue]));

    bars.exit()
        .transition()
        .attr("y", height)
        .attr("height", 0)
        .remove();
}

// Define scales globally before data is loaded
const x1 = d3.scaleTime().range([0, width]);
const y1 = d3.scaleLinear().range([height, 0]);

const x2 = d3.scaleBand().range([0, width]).padding(0.1);
const y2 = d3.scaleLinear().range([height, 0]);

// 2.a: LOAD...
d3.csv("weather.csv").then(data => {
    // console.log(data)
    // 2.b: ... AND TRANSFORM DATA

    // Parse chart 1 data
    data.forEach(d => {
        d.date = new Date(d.date);
        d.actual_max_temp = +d.actual_max_temp;
        d.average_max_temp = +d.average_max_temp;
        d.record_max_temp = +d.record_max_temp;
    
    // Parse chart 2 data
        d.year = d3.timeFormat("%B")(d.date); // Format year as "Month"
        d.record_precipitation = +d.record_precipitation;
        d.actual_precipitation = +d.actual_precipitation;
        d.average_precipitation = +d.average_precipitation;
    });

    // console.log("Parsed Data:", data);

    // 3.a: SET SCALES FOR CHART 1

    const aggregatedData = d3.group(data, d => d3.timeFormat("%Y-%m")(d.date));
    const parsedData = Array.from(aggregatedData, ([key, values]) => ({
        date: new Date(key + "-01"),
        actual_temp: d3.mean(values, d => d.actual_max_temp),
        historical_temp: d3.mean(values, d => d.average_max_temp),
        record_temp: d3.mean(values, d => d.record_max_temp)
    }));

    x1.domain(d3.extent(parsedData, d => d.date));
    y1.domain([d3.min(parsedData, d => d.record_temp) - 5, d3.max(parsedData, d => d.record_temp) + 5]);

    // 4.a: PLOT DATA FOR CHART 1

    // Define line functions
    const lineActual = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.actual_temp));

    const lineHistorical = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.historical_temp));

    const lineRecord = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.record_temp));

    // Append axes    
    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x1)
        .tickFormat(d3.timeFormat("%b")) // Show months (e.g., Jan, Feb, etc.)
    );

    svg1.append("g")
        .call(d3.axisLeft(y1));

    // Append line paths
    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", lineActual);

    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", lineHistorical)
        .attr("class", "trendline");

    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineRecord);


    // 5.a: ADD AXES FOR CHART 1


    // 6.a: ADD LABELS FOR CHART 1


    // 7.a: ADD INTERACTIVITY FOR CHART 1
    

    // ==========================================
    //         CHART 2 
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2
    x2.domain(data.map(d => d.year));
    y2.domain([0, d3.max(data, d => d.record_precipitation)]);

    // 4.b: PLOT DATA FOR CHART 2
    svg2.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.year))
        .attr("width", x2.bandwidth())
        .attr("y", d => y2(d.record_precipitation))
        .attr("height", d => height - y2(d.record_precipitation))
        .attr("fill", "steelblue");

    // 5.b: ADD AXES FOR CHART 2
    svg2.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2));

    svg2.append("g")
        .call(d3.axisLeft(y2));

    // 6.b: ADD LABELS FOR CHART 2
    svg2.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Month");

    svg2.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top)
        .text("Record Precipitation");

    // 7.b: ADD INTERACTIVITY FOR CHART 2
    // No interactivity for Chart 2

    // Set scales
    // const x = d3.scaleBand()
    //     .domain(data.map(d => d.year))
    //     .range([0, width])
    //     .padding(0.1);

    // const y = d3.scaleLinear()
    //     .range([height, 0]);

    // Add axes
    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2).tickFormat(d3.format("d")));

    svgBar.append("g")
        .attr("class", "y-axis");

    window.weatherData = data; // Store data globally
    // Initial chart update
    updateChart();
});

// window.updateChart = updateChart;