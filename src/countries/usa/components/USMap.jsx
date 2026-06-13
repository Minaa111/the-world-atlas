import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { statesList } from '../data/states';

export default function USMap({ selectedStates = [], onStateSelect, choroplethData, choroplethDimension }) {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const isRendered = useRef(false);

    // Keep refs of props to use inside d3 event handlers to avoid stale closures
    const selectedStatesRef = useRef(selectedStates);
    const onStateSelectRef = useRef(onStateSelect);
    const choroplethDataRef = useRef(choroplethData);
    const choroplethDimensionRef = useRef(choroplethDimension);

    useEffect(() => {
        selectedStatesRef.current = selectedStates;
        onStateSelectRef.current = onStateSelect;
        choroplethDataRef.current = choroplethData;
        choroplethDimensionRef.current = choroplethDimension;

        // Update styling of states when selectedStates or choroplethData change
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll(".state")
                .classed("is-selected", d => {
                    return selectedStates.some(s => s.name === d.properties.name);
                })
                .attr("fill", function (d) {
                    if (choroplethData) {
                        const stateName = d.properties.name;
                        if (choroplethData[stateName]) {
                            return choroplethData[stateName].color;
                        }
                        return "#E5E7EB";
                    }
                    return d3.select(this).classed("is-selected") ? "#bfdbfe" : "#EBE9FC";
                })
                .attr("stroke", function () {
                    return d3.select(this).classed("is-selected") ? "#2563eb" : "#010104";
                })
                .attr("stroke-width", function () {
                    return d3.select(this).classed("is-selected") ? "1.5" : "0.5";
                });
        }
    }, [selectedStates, onStateSelect, choroplethData]);

    useEffect(() => {
        if (isRendered.current) return;
        isRendered.current = true;

        const width = 1000;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "100%");

        // Add a background rect to catch zoom/drag events
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent");

        const g = svg.append("g");

        // Use Albers USA projection for the US map
        const projection = d3.geoAlbersUsa()
            .scale(1300)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const tooltip = d3.select(tooltipRef.current);

        d3.json("https://unpkg.com/us-atlas@3/states-10m.json").then((us) => {
            const states = topojson.feature(us, us.objects.states).features;

            g.selectAll(".state")
                .data(states)
                .enter()
                .append("path")
                .attr("class", "state transition-colors duration-200 cursor-pointer")
                .attr("d", path)
                .attr("fill", "#EBE9FC")
                .attr("stroke", "#010104")
                .attr("stroke-width", "0.5")
                .attr("vector-effect", "non-scaling-stroke")
                .on("mouseover", function (event, d) {
                    const stateName = d.properties.name;

                    if (choroplethDataRef.current) {
                        d3.select(this).attr("stroke-width", "1.5");
                    } else {
                        const isSelected = d3.select(this).classed("is-selected");
                        d3.select(this)
                            .attr("fill", isSelected ? "#93c5fd" : "#dcd9fa")
                            .attr("stroke-width", isSelected ? "2" : "1.5");
                    }

                    const stateObj = statesList.find(s => s.name === stateName);
                    const iso2 = stateObj ? stateObj.iso2 : null;

                    let valueHtml = '';
                    if (choroplethDataRef.current && choroplethDataRef.current[stateName]) {
                        const cData = choroplethDataRef.current[stateName];
                        const formattedVal = Number(cData.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        valueHtml = `<div style="font-weight: normal; margin-top: 4px; color: #a1a1aa;">${choroplethDimensionRef.current}: <span style="color: #fff; font-weight: bold;">${formattedVal} ${cData.unit || ''}</span></div>`;
                    }

                    tooltip.style("opacity", 1)
                        .html(`
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    ${iso2 ? `<img src="https://flagcdn.com/w40/us-${iso2.toLowerCase()}.png" width="24" style="border-radius:2px; object-fit:cover;" />` : ''}
                                    <span>${stateName}</span>
                                </div>
                                ${valueHtml}
                            </div>
                        `)
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mouseout", function (event, d) {
                    if (choroplethDataRef.current) {
                        d3.select(this).attr("stroke-width", "0.5");
                    } else {
                        const isSelected = d3.select(this).classed("is-selected");
                        d3.select(this)
                            .attr("fill", isSelected ? "#bfdbfe" : "#EBE9FC")
                            .attr("stroke-width", isSelected ? "1.5" : "0.5");
                    }

                    tooltip.style("opacity", 0);
                })
                .on("click", function (event, d) {
                    if (onStateSelectRef.current) {
                        onStateSelectRef.current({
                            name: d.properties.name
                        });
                    }
                });

            // Apply initial styling
            svg.selectAll(".state")
                .classed("is-selected", d => {
                    return selectedStatesRef.current.some(s => s.name === d.properties.name);
                })
                .attr("fill", function (d) {
                    if (choroplethDataRef.current) {
                        const stateName = d.properties.name;
                        if (choroplethDataRef.current[stateName]) {
                            return choroplethDataRef.current[stateName].color;
                        }
                        return "#E5E7EB";
                    }
                    return d3.select(this).classed("is-selected") ? "#bfdbfe" : "#EBE9FC";
                })
                .attr("stroke", function () {
                    return d3.select(this).classed("is-selected") ? "#2563eb" : "#010104";
                })
                .attr("stroke-width", function () {
                    return d3.select(this).classed("is-selected") ? "1.5" : "0.5";
                });

            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .translateExtent([[0, 0], [width, height]])
                .extent([[0, 0], [width, height]])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });

            svg.call(zoom);
        });

    }, []);

    return (
        <section
            id="us-map"
            className="relative w-full h-full flex flex-col justify-center items-center bg-white overflow-hidden"
        >
            <div className="w-full h-full flex items-center justify-center relative">
                <svg ref={svgRef}></svg>
            </div>
            <div
                ref={tooltipRef}
                className="fixed bg-[#010104] text-[#EBE9FC] px-3 py-2 rounded-md shadow-xl font-semibold text-sm pointer-events-none border border-[#3B3B3B]"
                style={{ opacity: 0, zIndex: 50, transition: 'opacity 0.2s ease-out' }}
            ></div>
        </section>
    );
}
