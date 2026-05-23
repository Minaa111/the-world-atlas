import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import lookup from 'country-code-lookup';

export default function Globe({ onCountrySelect }) {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
        const width = 800;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "100%");

        svg.selectAll("*").remove(); // Clear on re-render

        // Add a background rect to catch events
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent");

        const projection = d3.geoOrthographic()
            .scale(250)
            .translate([width / 2, height / 2])
            .clipAngle(90)
            .precision(0.1);

        const path = d3.geoPath().projection(projection);

        const g = svg.append("g");

        // Add globe sphere background (ocean)
        g.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "sphere")
            .attr("d", path)
            .attr("fill", "#F9F8FF") 
            .attr("stroke", "#dcd9fa")
            .attr("stroke-width", "1");

        // Add graticule (grid lines)
        const graticule = d3.geoGraticule();
        g.append("path")
            .datum(graticule())
            .attr("class", "graticule")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", "0.5")
            .attr("stroke-opacity", "0.5");

        const tooltip = d3.select(tooltipRef.current);

        d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then((world) => {
            const countries = topojson.feature(world, world.objects.countries).features.filter(d => d.properties.name !== "Antarctica");

            const countryPaths = g.selectAll(".country")
                .data(countries)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("fill", "#EBE9FC")
                .attr("stroke", "#010104")
                .attr("stroke-width", "0.5")
                .style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .attr("fill", "#dcd9fa")
                        .attr("stroke-width", "1.5");
                    
                    const countryName = d.properties.name;
                    let iso2 = null;
                    const countryId = d.id || d.properties?.ISO_A3;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) iso2 = result.iso2;
                    }
                    if (!iso2) {
                        const result = lookup.byCountry(countryName);
                        if (result) iso2 = result.iso2;
                    }

                    tooltip.style("opacity", 1)
                        .html(`
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${iso2 ? `<img src="https://flagcdn.com/w40/${iso2.toLowerCase()}.png" width="24" style="border-radius:2px" />` : ''}
                                <span>${countryName}</span>
                            </div>
                        `)
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mouseout", function(event, d) {
                    d3.select(this)
                        .attr("fill", "#EBE9FC")
                        .attr("stroke-width", "0.5");
                    tooltip.style("opacity", 0);
                })
                .on("click", function(event, d) {
                    const countryName = d.properties.name;
                    let iso2 = null;
                    let iso3 = null;
                    const countryId = d.id || d.properties?.ISO_A3;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) {
                            iso2 = result.iso2;
                            iso3 = result.iso3;
                        }
                    }
                    if (!iso2) {
                        const result = lookup.byCountry(countryName);
                        if (result) {
                            iso2 = result.iso2;
                            iso3 = result.iso3;
                        }
                    }
                    if (onCountrySelect) {
                        onCountrySelect({ name: countryName, code: iso2, iso3: iso3 });
                    }
                });

            // Drag behavior for rotation
            const drag = d3.drag()
                .on("start", (event) => {
                    const r = projection.rotate();
                    svg.property("drag_start", [r[0], r[1], event.x, event.y]);
                })
                .on("drag", (event) => {
                    const start = svg.property("drag_start");
                    if (!start) return;
                    const r = [
                        start[0] + (event.x - start[2]) * 0.25,
                        start[1] - (event.y - start[3]) * 0.25
                    ];
                    projection.rotate(r);
                    svg.selectAll("path.country").attr("d", path);
                    svg.selectAll("path.sphere").attr("d", path);
                    svg.selectAll("path.graticule").attr("d", path);
                });

            svg.call(drag);

            // Zoom behavior
            const initialScale = 250;
            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", (event) => {
                    projection.scale(initialScale * event.transform.k);
                    svg.selectAll("path.country").attr("d", path);
                    svg.selectAll("path.sphere").attr("d", path);
                    svg.selectAll("path.graticule").attr("d", path);
                });

            // Call zoom but remove its default drag/pan behavior so it doesn't conflict with our rotation drag
            svg.call(zoom)
               .on("mousedown.zoom", null)
               .on("touchstart.zoom", null)
               .on("touchmove.zoom", null)
               .on("touchend.zoom", null);

        });

    }, [onCountrySelect]);

    return (
        <div className="relative w-full h-full flex justify-center items-center overflow-hidden bg-white">
            <div className="w-full max-w-7xl h-full flex items-center justify-center relative">
                <svg ref={svgRef}></svg>
            </div>
            <div 
                ref={tooltipRef} 
                className="fixed bg-[#010104] text-[#EBE9FC] px-3 py-2 rounded-md shadow-xl font-semibold text-sm pointer-events-none border border-[#3B3B3B]"
                style={{ opacity: 0, zIndex: 50, transition: 'opacity 0.2s ease-out' }}
            ></div>
        </div>
    );
}
