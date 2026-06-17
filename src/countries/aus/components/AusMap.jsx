import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export default function AusMap({ selectedStates = [], onStateSelect, choroplethData, choroplethDimension }) {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const isRendered = useRef(false);

    const selectedStatesRef = useRef(selectedStates);
    const onStateSelectRef = useRef(onStateSelect);
    const choroplethDataRef = useRef(choroplethData);
    const choroplethDimensionRef = useRef(choroplethDimension);

    useEffect(() => {
        selectedStatesRef.current = selectedStates;
        onStateSelectRef.current = onStateSelect;
        choroplethDataRef.current = choroplethData;
        choroplethDimensionRef.current = choroplethDimension;

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

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent");

        const g = svg.append("g");
        const tooltip = d3.select(tooltipRef.current);

        d3.json("https://code.highcharts.com/mapdata/countries/au/au-all.topo.json").then((topo) => {
            const geojson = topojson.feature(topo, topo.objects.default);
            
            // Use Mercator projection for Australia since it is commonly used and fits well
            const projection = d3.geoMercator()
                .fitSize([width, height], geojson);

            const path = d3.geoPath().projection(projection);

            g.selectAll(".state")
                .data(geojson.features)
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

                    const valData = choroplethDataRef.current ? choroplethDataRef.current[stateName] : null;

                    let valueHtml = '';
                    if (valData) {
                        const formattedVal = Number(valData.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        valueHtml = `<div style="font-weight: normal; margin-top: 4px; color: #a1a1aa;">${choroplethDimensionRef.current}: <span style="color: #fff; font-weight: bold;">${formattedVal} ${valData.unit || ''}</span></div>`;
                    }

                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; align-items: center; gap: 8px;">
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
                .on("mouseout", function () {
                    if (choroplethDataRef.current) {
                        d3.select(this).attr("stroke-width", "0.5");
                    } else {
                        const isSelected = d3.select(this).classed("is-selected");
                        d3.select(this)
                            .attr("fill", isSelected ? "#bfdbfe" : "#EBE9FC")
                            .attr("stroke-width", isSelected ? "1.5" : "0.5");
                    }

                    tooltip.transition().duration(500).style("opacity", 0);
                })
                .on("click", function (event, d) {
                    if (onStateSelectRef.current) {
                        onStateSelectRef.current({ name: d.properties.name });
                    }
                });

            if (selectedStatesRef.current.length > 0 || choroplethDataRef.current) {
                const cData = choroplethDataRef.current;
                g.selectAll(".state")
                    .classed("is-selected", d => {
                        return selectedStatesRef.current.some(s => s.name === d.properties.name);
                    })
                    .attr("fill", function (d) {
                        if (cData) {
                            return cData[d.properties.name] ? cData[d.properties.name].color : "#E5E7EB";
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

            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .translateExtent([[0, 0], [width, height]])
                .extent([[0, 0], [width, height]])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });

            svg.call(zoom);

        }).catch(err => {
            console.error("Failed to load Australia map data:", err);
        });

    }, []);

    return (
        <section className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
            <div className="w-full h-full flex items-center justify-center relative">
                <svg ref={svgRef} className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div
                ref={tooltipRef}
                className="fixed bg-[#010104] text-[#EBE9FC] px-3 py-2 rounded-md shadow-xl font-semibold text-sm pointer-events-none border border-[#3B3B3B]"
                style={{ opacity: 0, zIndex: 50, transition: 'opacity 0.2s ease-out' }}
            />
        </section>
    );
}
