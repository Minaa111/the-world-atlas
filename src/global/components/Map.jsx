import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import lookup from 'country-code-lookup';

export default function Map({ selectedCountries = [], onCountrySelect, choroplethData, choroplethDimension, hoveredCountry }) {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const isRendered = useRef(false);

    // Keep refs of props to use inside d3 event handlers to avoid stale closures
    const selectedCountriesRef = useRef(selectedCountries);
    const onCountrySelectRef = useRef(onCountrySelect);
    const choroplethDataRef = useRef(choroplethData);
    const choroplethDimensionRef = useRef(choroplethDimension);
    const hoveredCountryRef = useRef(hoveredCountry);
    const originalZoomRef = useRef(null);

    const d3Objects = useRef({
        svg: null,
        g: null,
        path: null,
        zoom: null,
        countriesData: null
    });

    useEffect(() => {
        selectedCountriesRef.current = selectedCountries;
        onCountrySelectRef.current = onCountrySelect;
        choroplethDataRef.current = choroplethData;
        choroplethDimensionRef.current = choroplethDimension;
        hoveredCountryRef.current = hoveredCountry;

        // Update styling of countries when selectedCountries or choroplethData change
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll(".country")
                .classed("is-selected", d => {
                    return selectedCountries.some(c => c.name === d.properties.name);
                })
                .attr("fill", function (d) {
                    const countryName = d.properties.name;
                    let iso3 = null;
                    const countryId = d.id || d.properties?.ISO_A3;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) iso3 = result.iso3;
                    }
                    if (!iso3) {
                        const result = lookup.byCountry(countryName);
                        if (result) iso3 = result.iso3;
                    }

                    if (choroplethData) {
                        if (iso3 && choroplethData[iso3]) {
                            return choroplethData[iso3].color;
                        }
                        return "#E5E7EB";
                    }

                    const isSelected = d3.select(this).classed("is-selected");

                    if (hoveredCountry && iso3 === hoveredCountry.iso3) {
                        return hoveredCountry.fillColor;
                    }

                    return isSelected ? "#bfdbfe" : "#EBE9FC";
                })
                .attr("stroke", function (d) {
                    const countryName = d.properties.name;
                    let iso3 = null;
                    const countryId = d.id || d.properties?.ISO_A3;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) iso3 = result.iso3;
                    }
                    if (!iso3) {
                        const result = lookup.byCountry(countryName);
                        if (result) iso3 = result.iso3;
                    }

                    const isSelected = d3.select(this).classed("is-selected");

                    if (hoveredCountry && iso3 === hoveredCountry.iso3) {
                        return hoveredCountry.strokeColor;
                    }

                    return isSelected ? "#2563eb" : "#010104";
                })
                .attr("stroke-width", function (d) {
                    const countryName = d.properties.name;
                    let iso3 = null;
                    const countryId = d.id || d.properties?.ISO_A3;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) iso3 = result.iso3;
                    }
                    if (!iso3) {
                        const result = lookup.byCountry(countryName);
                        if (result) iso3 = result.iso3;
                    }

                    const isSelected = d3.select(this).classed("is-selected");
                    if (hoveredCountry && iso3 === hoveredCountry.iso3) {
                        return "1.5";
                    }
                    return isSelected ? "1.5" : "0.5";
                });
        }
    }, [selectedCountries, onCountrySelect, choroplethData, hoveredCountry]);

    // Handle zoom when hoveredCountry changes
    useEffect(() => {
        if (hoveredCountry && d3Objects.current.svg && d3Objects.current.countriesData) {
            const { svg, path, zoom, countriesData } = d3Objects.current;

            if (!originalZoomRef.current) {
                originalZoomRef.current = d3.zoomTransform(svg.node());
            }

            const targetFeature = countriesData.find(d => {
                const countryId = d.id || d.properties?.ISO_A3;
                let iso3 = null;
                if (countryId) {
                    const result = lookup.byIso(String(countryId));
                    if (result) iso3 = result.iso3;
                }
                if (!iso3) {
                    const result = lookup.byCountry(d.properties.name);
                    if (result) iso3 = result.iso3;
                }
                return iso3 === hoveredCountry.iso3;
            });

            if (targetFeature) {
                const bounds = path.bounds(targetFeature);
                const dx = bounds[1][0] - bounds[0][0];
                const dy = bounds[1][1] - bounds[0][1];
                const x = (bounds[0][0] + bounds[1][0]) / 2;
                const y = (bounds[0][1] + bounds[1][1]) / 2;
                const scale = Math.max(1, Math.min(4, 0.9 / Math.max(dx / 1000, dy / 600)));
                const translate = [1000 / 2 - scale * x, 600 / 2 - scale * y];

                let iso2 = null;
                const countryId = targetFeature.id || targetFeature.properties?.ISO_A3;
                if (countryId) {
                    const result = lookup.byIso(String(countryId));
                    if (result) iso2 = result.iso2;
                }
                if (!iso2) {
                    const result = lookup.byCountry(targetFeature.properties.name);
                    if (result) iso2 = result.iso2;
                }

                svg.transition()
                    .duration(1000)
                    .call(
                        zoom.transform,
                        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                    )
                    .on("end", () => {
                        const tooltip = d3.select(tooltipRef.current);
                        const centroid = path.centroid(targetFeature);
                        if (centroid && !isNaN(centroid[0])) {
                            const svgRect = svgRef.current.getBoundingClientRect();
                            // we need to translate centroid to the current zoom state
                            const currentTransform = d3.zoomTransform(svg.node());
                            const finalX = currentTransform.applyX(centroid[0]);
                            const finalY = currentTransform.applyY(centroid[1]);

                            tooltip.style("opacity", 1)
                                .html(`
                                    <div style="display: flex; flex-direction: column;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            ${iso2 ? `<img src="https://flagcdn.com/w40/${iso2.toLowerCase()}.png" width="24" style="border-radius:2px" />` : ''}
                                            <span>${targetFeature.properties.name}</span>
                                        </div>
                                        <div style="font-weight: normal; margin-top: 4px; color: #a1a1aa;">
                                            ${hoveredCountry.value}
                                        </div>
                                    </div>
                                `)
                                .style("left", (svgRect.left + finalX + 15) + "px")
                                .style("top", (svgRect.top + finalY + 15) + "px");
                        }
                    });
            }
        } else if (!hoveredCountry && d3Objects.current.svg && originalZoomRef.current) {
            const { svg, zoom } = d3Objects.current;
            const targetTransform = originalZoomRef.current;
            originalZoomRef.current = null;

            svg.transition()
                .duration(1000)
                .call(zoom.transform, targetTransform);

            d3.select(tooltipRef.current).style("opacity", 0);
        } else {
            d3.select(tooltipRef.current).style("opacity", 0);
        }
    }, [hoveredCountry]);

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

        // Use Natural Earth projection
        const projection = d3.geoNaturalEarth1()
            .scale(200)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Zoom and Drag (Panning) behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                // Hide cross-talk tooltip during manual zoom/pan
                if (!hoveredCountryRef.current) {
                    d3.select(tooltipRef.current).style("opacity", 0);
                }
            });

        svg.call(zoom);

        d3Objects.current = { svg, g, path, zoom, countriesData: null };

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
            d3Objects.current.countriesData = countries;

            g.selectAll(".country")
                .data(countries)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("fill", "#EBE9FC")
                .attr("stroke", "#010104")
                .attr("stroke-width", "0.5")
                .attr("vector-effect", "non-scaling-stroke")
                .style("cursor", "pointer")
                .on("mouseover", function (event, d) {
                    if (hoveredCountryRef.current) return;
                    
                    const countryName = d.properties.name;

                    if (choroplethDataRef.current) {
                        d3.select(this).attr("stroke-width", "1.5");
                    } else {
                        const isSelected = d3.select(this).classed("is-selected");
                        d3.select(this)
                            .attr("fill", isSelected ? "#93c5fd" : "#dcd9fa")
                            .attr("stroke-width", isSelected ? "2" : "1.5");
                    }

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

                    let valueHtml = '';
                    let iso3 = null;
                    if (countryId) {
                        const result = lookup.byIso(String(countryId));
                        if (result) iso3 = result.iso3;
                    }
                    if (!iso3) {
                        const result = lookup.byCountry(countryName);
                        if (result) iso3 = result.iso3;
                    }

                    if (choroplethDataRef.current && iso3 && choroplethDataRef.current[iso3]) {
                        const cData = choroplethDataRef.current[iso3];
                        const formattedVal = Number(cData.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        valueHtml = `<div style="font-weight: normal; margin-top: 4px; color: #a1a1aa;">${choroplethDimensionRef.current}: <span style="color: #fff; font-weight: bold;">${formattedVal} ${cData.unit}</span></div>`;
                    }

                    tooltip.style("opacity", 1)
                        .html(`
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    ${iso2 ? `<img src="https://flagcdn.com/w40/${iso2.toLowerCase()}.png" width="24" style="border-radius:2px" />` : ''}
                                    <span>${countryName}</span>
                                </div>
                                ${valueHtml}
                            </div>
                        `)
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mousemove", function (event) {
                    if (hoveredCountryRef.current) return;
                    tooltip
                        .style("left", (event.clientX + 15) + "px")
                        .style("top", (event.clientY + 15) + "px");
                })
                .on("mouseout", function (event, d) {
                    if (hoveredCountryRef.current) return;
                    
                    const countryName = d.properties.name;

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
                    if (onCountrySelectRef.current) {
                        onCountrySelectRef.current({ name: countryName, code: iso2, iso3: iso3 });
                    }
                });

            // Trigger initial selection formatting
            svg.selectAll(".country")
                .classed("is-selected", d => {
                    return selectedCountriesRef.current.some(c => c.name === d.properties.name);
                })
                .attr("fill", function (d) {
                    if (choroplethDataRef.current) {
                        const countryName = d.properties.name;
                        let iso3 = null;
                        const countryId = d.id || d.properties?.ISO_A3;
                        if (countryId) {
                            const result = lookup.byIso(String(countryId));
                            if (result) iso3 = result.iso3;
                        }
                        if (!iso3) {
                            const result = lookup.byCountry(countryName);
                            if (result) iso3 = result.iso3;
                        }

                        if (iso3 && choroplethDataRef.current[iso3]) {
                            return choroplethDataRef.current[iso3].color;
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
        });

    }, []);

    return (
        <section
            id="map"
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