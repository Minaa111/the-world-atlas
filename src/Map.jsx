import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import lookup from "country-code-lookup";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

function Map({ selectedCountries = [], onCountrySelect }) {
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const getCountryInfo = (geo) => {
        const countryId = geo.id || geo.properties?.ISO_A3;
        if (countryId) {
            const result = lookup.byIso(String(countryId));
            if (result) return { iso2: result.iso2, iso3: result.iso3 };
        }
        const result = lookup.byCountry(geo.properties?.name);
        return result ? { iso2: result.iso2, iso3: result.iso3 } : { iso2: null, iso3: null };
    };

    return (
        <section
            id="map"
            className="relative w-full h-full flex flex-col justify-center items-center bg-white overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            <div className="w-full max-w-7xl h-full flex items-center justify-center relative">
                <ComposableMap projectionConfig={{ scale: 180, center: [0, 5] }} style={{ width: "100%", height: "100%" }}>
                    <defs>
                        <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#312e81" />
                        </linearGradient>
                    </defs>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const countryName = geo.properties.name;
                                if (countryName === "Antarctica") return null;
                                const isSelected = selectedCountries.some(c => c.name === countryName);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => {
                                            if (onCountrySelect) {
                                                const info = getCountryInfo(geo);
                                                onCountrySelect({ name: countryName, code: info.iso2, iso3: info.iso3 });
                                            }
                                        }}
                                        onMouseEnter={() => {
                                            const info = getCountryInfo(geo);
                                            setHoveredCountry({
                                                name: countryName,
                                                code: info.iso2
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        style={{
                                            default: {
                                                fill: isSelected ? "url(#selectedGradient)" : "#EBE9FC",
                                                stroke: isSelected ? "#ffffff" : "#010104",
                                                strokeWidth: isSelected ? 1 : 0.5,
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: isSelected ? "url(#selectedGradient)" : "#dcd9fa",
                                                stroke: isSelected ? "#ffffff" : "#010104",
                                                strokeWidth: isSelected ? 1.5 : 0.5,
                                                outline: "none",
                                                cursor: "pointer",
                                                transition: "all 250ms"
                                            },
                                            pressed: {
                                                fill: isSelected ? "url(#selectedGradient)" : "#010104",
                                                stroke: isSelected ? "#ffffff" : "#010104",
                                                strokeWidth: isSelected ? 1 : 0.5,
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            {/* Hover Tooltip */}
            {hoveredCountry && (
                <div
                    style={{
                        position: 'fixed',
                        top: mousePos.y + 15,
                        left: mousePos.x + 15,
                        zIndex: 50
                    }}
                    className="bg-[#010104] text-[#EBE9FC] px-3 py-2 rounded-md shadow-xl flex items-center gap-3 font-semibold text-sm animate-fade-in pointer-events-none border border-[#3B3B3B]"
                >
                    {hoveredCountry.code && (
                        <img
                            src={`https://flagcdn.com/w40/${hoveredCountry.code.toLowerCase()}.png`}
                            alt={`${hoveredCountry.name} flag`}
                            className="w-6 h-auto rounded-[2px]"
                        />
                    )}
                    <span>{hoveredCountry.name}</span>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </section>
    );
}

export default Map;