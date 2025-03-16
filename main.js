// ===========================
// 1: SET GLOBAL VARIABLES
// ===========================
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

// Define scales globally before data is loaded
const x1 = d3.scaleTime().range([0, width]);
const y1 = d3.scaleLinear().range([height, 0]);

const x2 = d3.scaleBand().range([0, width]).padding(0.1);
const y2 = d3.scaleLinear().range([height, 0]);

// Bar Graph: Dropdown Menu
const dropdown = d3.select("#dropdownMenu")
    .append("select")
    .attr("id", "precipitationType")
    .style("margin-bottom", "15px")
    .style("padding", "5px")
    .style("font-size", "14px")
    .on("change", updateCombinedChart);

// Bar Graph: Options for the dropdown menu
const options = ["Record Precipitation", "Actual Precipitation", "Average Precipitation"];
dropdown.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(d => d)
    .property("selected", d => d === "Record Precipitation");

function updateChart() {
    if (!window.weatherData) return;
    const selectedOption = d3.select("#precipitationType").property("value");
    let yValue;

    if (selectedOption === "Record Precipitation") {
        yValue = "record_precipitation";
    } else if (selectedOption === "Actual Precipitation") {
        yValue = "actual_precipitation";
    } else if (selectedOption === "Average Precipitation") {
        yValue = "average_precipitation";
    } else {
        svgBar.selectAll(".bar").remove();
        return;
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

const xCombined = d3.scaleBand().range([0, width]).padding(0.1);
const yCombined = d3.scaleLinear().range([height, 0]);

// ===========================
// 2.a: LOAD...
// ===========================

d3.csv("weather.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA

    // Parse chart 1 data
    data.forEach(d => {
        d.date = new Date(d.date);
        d.actual_max_temp = +d.actual_max_temp;
        d.average_max_temp = +d.average_max_temp;
        d.record_max_temp = +d.record_max_temp;
    
    // Parse chart 2 data
        d.year = d3.timeFormat("%B")(d.date);
        d.record_precipitation = +d.record_precipitation;
        d.actual_precipitation = +d.actual_precipitation;
        d.average_precipitation = +d.average_precipitation;
    });

    window.weatherData = data; // Store data globally for use in update functions

    // =========================================
    // 3.a: SET SCALES FOR CHART 1 (Line Chart)
    // =========================================

    const aggregatedData = d3.group(data, d => d3.timeFormat("%Y-%m")(d.date));
    const parsedData = Array.from(aggregatedData, ([key, values]) => ({
        date: new Date(key + "-01"),
        actual_temp: d3.mean(values, d => d.actual_max_temp),
        historical_temp: d3.mean(values, d => d.average_max_temp),
        record_temp: d3.mean(values, d => d.record_max_temp)
    }));

    const minTemp = d3.min(parsedData, d => Math.min(d.actual_temp, d.historical_temp, d.record_temp));
    const maxTemp = d3.max(parsedData, d => Math.max(d.actual_temp, d.historical_temp, d.record_temp));

    x1.domain(d3.extent(parsedData, d => d.date));
    y1.domain([minTemp - 5, maxTemp + 5]); // CHANGED: Added buffer so all lines are visible

    // =========================================
    // 4.a: PLOT DATA FOR CHART 1 (Line Chart)
    // =========================================

    const lineActual = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.actual_temp));

    const lineHistorical = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.historical_temp));

    const lineRecord = d3.line()
        .x(d => x1(d.date))
        .y(d => y1(d.record_temp));

    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("class", "line actual-temp")
        .attr("d", lineActual);

    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("class", "line historical-temp")
        .attr("d", lineHistorical);

    svg1.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("class", "line record-temp")
        .attr("d", lineRecord);

    // =========================================
    // 5.a: ADD AXES FOR CHART 1 (Line Chart)
    // =========================================

    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x1).tickFormat(d3.timeFormat("%B")))

    svg1.append("g")
        .call(d3.axisLeft(y1));

    // =========================================
    // 6.a: ADD LABELS FOR CHART 1 (Line Chart)
    // =========================================

    // X-axis label
    svg1.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Months");

    // Y-axis label
    svg1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Temperature (°F)");

    // Define legend data
    const legendData = [
        { label: "Actual Max Temperature", color: "steelblue" },
        { label: "Average Max Temperature", color: "orange" },
        { label: "Record Max Temperature", color: "red" }
    ];

    // Create a legend container
    const legend = svg1.append("g")
        .attr("transform", `translate(${width - 150}, ${height - 80})`);

    // Append legend items (colored circles)
    legend.selectAll("legendDots")
        .data(legendData)
        .enter()
        .append("circle")
        .attr("cx", 0)
        .attr("cy", (d, i) => i * 20)
        .attr("r", 6)
        .style("fill", d => d.color);

    // Append text labels next to the circles
    legend.selectAll("legendLabels")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 5)
        .style("fill", "black")
        .text(d => d.label)
        .attr("text-anchor", "start")
        .style("font-size", "12px");

    // =========================================
    // 7.a: ADD INTERACTIVITY FOR CHART 1 (Line Chart - Trendline)
    // =========================================

    const trendlineOptions = ["No Trendline", "Actual Max Temperature", "Average Max Temperature", "Record Max Temperature"];

    const trendlineDropdown = d3.select("#lineChartDropdown")
        .append("select")
        .attr("id", "trendlineSelector")
        .style("margin-bottom", "15px")
        .style("padding", "5px")
        .style("font-size", "14px")
        .on("change", updateTrendline);
    
    trendlineDropdown.selectAll("option")
        .data(trendlineOptions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
    
    const trendline = svg1.append("path")
        .attr("fill", "none")
        .attr("stroke", "black") 
        .attr("stroke-dasharray", "5,5") 
        .attr("stroke-width", 2)
        .attr("class", "trendline")
        .style("opacity", 0); 
        
    function movingAverage(data, yAccessor, windowSize = 5) {
        return data.map((d, i, arr) => {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(arr.length, i + Math.ceil(windowSize / 2));
            const subset = arr.slice(start, end);
            return {
                date: d.date,
                value: d3.mean(subset, yAccessor)
            };
        });
    }

    function updateTrendline() {
        const selectedTrendline = d3.select("#trendlineSelector").property("value");
        
        let yAccessor = selectedTrendline === "Actual Max Temperature" ? d => d.actual_temp
            :selectedTrendline === "Average Max Temperature" ? d => d.historical_temp
            :selectedTrendline === "Record Max Temperature" ? d => d.record_temp
            :null;

        if (!yAccessor) return trendline.style("opacity", 0);

        const trendData = movingAverage(parsedData, yAccessor);

        const trendlineFunction = d3.line()
            .x(d => x1(d.date))
            .y(d => y1(d.value))
            .curve(d3.curveBasis);

        trendline.datum(trendData)
            .transition()
            .duration(500)
            .attr("d", trendlineFunction)
            .style("opacity", 1);
    }

    updateTrendline();

    // ==========================================
    //         CHART 2 
    // ==========================================

    // ==========================================
    // 3.b: SET SCALES FOR CHART 2 (Bar Chart)
    // ==========================================

    x2.domain(data.map(d => d.year));
    y2.domain([0, d3.max(data, d => d.record_precipitation)]);

    // ==========================================
    // 4.b: PLOT DATA FOR CHART 2 (Bar Chart)
    // ==========================================

    updateCombinedChart();

    // ==========================================
    // 5.b: ADD AXES FOR CHART 2 (Bar Chart)
    // ==========================================

    svg2.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2));

    svg2.append("g")
        .call(d3.axisLeft(y2));

    // ==========================================
    // 6.b: ADD LABELS FOR CHART 2 (Bar Chart)
    // ==========================================

    svg2.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Months");

    svg2.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 40)
        .attr("x", -margin.top - 20)
        .text("Precipitation (inches)");

    window.weatherData = data; // Store data globally
    updateChart();
    updateCombinedChart();
});

// Function to update the combined chart based on dropdown selection
function updateCombinedChart() {
    if (!window.weatherData) return; // Ensure data is loaded
    const selectedOption = d3.select("#precipitationType").property("value");
    let yValue, color;

    if (selectedOption === "Record Precipitation") {
        yValue = "record_precipitation";
        color = "lightblue";
    } else if (selectedOption === "Actual Precipitation") {
        yValue = "actual_precipitation";
        color = "dodgerblue";
    } else if (selectedOption === "Average Precipitation") {
        yValue = "average_precipitation";
        color = "darkblue";
    }

    y2.domain([0, d3.max(window.weatherData, d => d[yValue])]);

    svg2.select(".y-axis")
        .transition()
        .call(d3.axisLeft(y2));

    const bars = svg2.selectAll(".bar")
        .data(window.weatherData, d => d.year);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.year))
        .attr("width", x2.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", color)
        .merge(bars)
        .transition()
        .attr("x", d => x2(d.year))
        .attr("width", x2.bandwidth())
        .attr("y", d => y2(d[yValue]))
        .attr("height", d => height - y2(d[yValue]))
        .attr("fill", color);

    bars.exit()
        .transition()
        .attr("y", height)
        .attr("height", 0)
        .remove();
}