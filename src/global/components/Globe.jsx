import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import lookup from 'country-code-lookup';

export default function Globe({ selectedCountries = [], onCountrySelect, choroplethData, choroplethDimension, hoveredCountry }) {
    const svgRef = useRef();
    const tooltipRef = useRef();
    const isRendered = useRef(false);

    const selectedCountriesRef = useRef(selectedCountries);
    const onCountrySelectRef = useRef(onCountrySelect);
    const choroplethDataRef = useRef(choroplethData);
    const choroplethDimensionRef = useRef(choroplethDimension);
    const hoveredCountryRef = useRef(hoveredCountry);
    const isInteractingRef = useRef(false);
    const isDraggingRef = useRef(false);
    const originalRotationRef = useRef(null);
    const originalScaleRef = useRef(null);

    // D3 objects to persist across renders
    const d3Objects = useRef({
        projection: null,
        path: null,
        svg: null,
        countriesData: null
    });

    // Sync refs
    useEffect(() => {
        selectedCountriesRef.current = selectedCountries;
        onCountrySelectRef.current = onCountrySelect;
        choroplethDataRef.current = choroplethData;
        choroplethDimensionRef.current = choroplethDimension;
        hoveredCountryRef.current = hoveredCountry;

        const updateColors = () => {
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

                        // Hovered Card override (Takes precedence over selected)
                        if (hoveredCountry && iso3 === hoveredCountry.iso3) {
                            return hoveredCountry.fillColor; // Thematic color
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
                        
                        // Give hovered state a stronger stroke color to match the fill
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
        };

        updateColors();
    }, [selectedCountries, onCountrySelect, choroplethData, hoveredCountry]);

    // Handle rotation when hoveredCountry changes
    useEffect(() => {
        if (hoveredCountry && d3Objects.current.projection && d3Objects.current.countriesData) {
            const { projection, path, svg, countriesData } = d3Objects.current;
            
            // Save original rotation and scale if we haven't already
            if (!originalRotationRef.current) {
                originalRotationRef.current = projection.rotate();
                originalScaleRef.current = projection.scale();
            }

            // Find feature
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
                // Get centroid and transition rotation
                const centroid = d3.geoCentroid(targetFeature);
                const currentRotate = projection.rotate();
                const targetRotate = [-centroid[0], -centroid[1]];
                const currentScale = projection.scale();
                const targetScale = 450; // Zoomed in scale
                
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
                
                d3.transition()
                    .duration(1000)
                    .tween("rotateAndZoom", () => {
                        const r = d3.interpolate(currentRotate, targetRotate);
                        const s = d3.interpolate(currentScale, targetScale);
                        return (t) => {
                            projection.rotate(r(t));
                            projection.scale(s(t));
                            svg.selectAll("path.country").attr("d", path);
                            svg.selectAll("path.sphere").attr("d", path);
                            svg.selectAll("path.graticule").attr("d", path);
                        };
                    })
                    .on("end", () => {
                        // After rotation, show tooltip
                        const tooltip = d3.select(tooltipRef.current);
                        const coords = projection(centroid);
                        if (coords) {
                            const svgRect = svgRef.current.getBoundingClientRect();
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
                                .style("left", (svgRect.left + coords[0] + 15) + "px")
                                .style("top", (svgRect.top + coords[1] + 15) + "px");
                        }
                    });
            }
        } else if (!hoveredCountry && d3Objects.current.projection && originalRotationRef.current) {
            // Revert back to original rotation when hover ends
            const { projection, path, svg } = d3Objects.current;
            const currentRotate = projection.rotate();
            const targetRotate = originalRotationRef.current;
            const currentScale = projection.scale();
            const targetScale = originalScaleRef.current || 250;
            
            originalRotationRef.current = null; // Clear so auto-rotate resumes from here
            originalScaleRef.current = null;
            
            d3.transition()
                .duration(1000)
                .tween("rotateAndZoom", () => {
                    const r = d3.interpolate(currentRotate, targetRotate);
                    const s = d3.interpolate(currentScale, targetScale);
                    return (t) => {
                        projection.rotate(r(t));
                        projection.scale(s(t));
                        svg.selectAll("path.country").attr("d", path);
                        svg.selectAll("path.sphere").attr("d", path);
                        svg.selectAll("path.graticule").attr("d", path);
                    };
                });
            
            // Hide tooltip
            d3.select(tooltipRef.current).style("opacity", 0);
        } else {
            // Hide tooltip if hoveredCountry becomes null and no original rotation was set
            d3.select(tooltipRef.current).style("opacity", 0);
        }
    }, [hoveredCountry]);

    useEffect(() => {
        if (isRendered.current) return;
        isRendered.current = true;

        const width = 800;
        const height = 600;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("width", "100%")
            .style("height", "100%")
            .on("mousemove", (event) => {
                // Determine if we are mathematically inside the globe's radius
                const [x, y] = d3.pointer(event);
                const dx = x - width / 2;
                const dy = y - height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Use the current scale (radius) to dynamically support zoomed-in states!
                if (distance <= d3Objects.current.projection.scale()) {
                    isInteractingRef.current = true;
                } else {
                    isInteractingRef.current = false;
                }
            })
            .on("mouseleave", () => {
                isInteractingRef.current = false;
            });

        svg.selectAll("*").remove(); // Clear on re-render
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

        // Store for auto-rotation and focus
        d3Objects.current = { projection, path, svg, countriesData: null };

        const g = svg.append("g");

        // Sphere
        g.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "sphere")
            .attr("d", path)
            .attr("fill", "#F9F8FF")
            .attr("stroke", "#dcd9fa")
            .attr("stroke-width", "1");

        // Graticule
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
                .style("cursor", "pointer")
                .on("mouseover", function (event, d) {
                    // Don't interfere if being highlighted by cross-talk
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

            // Drag
            const drag = d3.drag()
                .on("start", (event) => {
                    isDraggingRef.current = true;
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
                })
                .on("end", () => {
                    isDraggingRef.current = false;
                });

            svg.call(drag);

            // Auto-rotate timer
            d3.timer(() => {
                if (!isInteractingRef.current && !isDraggingRef.current && !hoveredCountryRef.current) {
                    const r = projection.rotate();
                    r[0] += 0.2; // slight rotation
                    projection.rotate(r);
                    svg.selectAll("path.country").attr("d", path);
                    svg.selectAll("path.sphere").attr("d", path);
                    svg.selectAll("path.graticule").attr("d", path);
                }
            });

            // Zoom
            const initialScale = 250;
            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", (event) => {
                    projection.scale(initialScale * event.transform.k);
                    svg.selectAll("path.country").attr("d", path);
                    svg.selectAll("path.sphere").attr("d", path);
                    svg.selectAll("path.graticule").attr("d", path);
                });

            svg.call(zoom)
                .on("mousedown.zoom", null)
                .on("touchstart.zoom", null)
                .on("touchmove.zoom", null)
                .on("touchend.zoom", null);
        });

    }, []);

    return (
        <div 
            className="relative w-full h-full flex justify-center items-center overflow-hidden bg-white"
        >
            <div className="w-full h-full flex items-center justify-center relative">
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
