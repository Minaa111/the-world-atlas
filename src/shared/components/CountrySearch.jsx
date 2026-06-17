import React, { useState, useEffect, useRef } from "react";
import { countries } from "../../global/data/countries";
import { Search, ArrowDown, MapPin } from "lucide-react";
import { useScope } from "../context/ScopeContext";

// Currently we only have the USA, Canada, and Australia implemented.
const AVAILABLE_COUNTRIES = ["US", "CA", "AU"];

export default function CountrySearch() {
    const { activeCountry, changeScope } = useScope();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeContinent, setActiveContinent] = useState("All");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const availableCountriesData = countries.filter(c => AVAILABLE_COUNTRIES.includes(c.iso2));
    const continents = ["All", ...new Set(availableCountriesData.map(c => c.continent).filter(Boolean))];

    const filtered = availableCountriesData.filter(c => {
        const matchesContinent = activeContinent === "All" || c.continent === activeContinent;
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchLower || 
                              c.name.toLowerCase().includes(searchLower) || 
                              (c.iso2 && c.iso2.toLowerCase().includes(searchLower)) ||
                              (c.iso3 && c.iso3.toLowerCase().includes(searchLower));
        return matchesContinent && matchesSearch;
    });

    const handleSelect = (country) => {
        setIsOpen(false);
        setSearchTerm("");
        // changeScope updates context and routes automatically
        changeScope('country', country.iso3.toLowerCase());
    };

    return (
        <div className="relative w-64 lg:w-80" ref={containerRef}>
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Search country or ISO..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EBE9FC] bg-[#F9F8FF] focus:outline-none focus:ring-2 focus:ring-[#3A31D8]/50 text-sm font-semibold text-[#010104] placeholder:text-gray-400 transition-shadow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-[#EBE9FC] overflow-hidden flex flex-col z-50 max-h-[400px]">
                    <div className="p-3 border-b border-[#EBE9FC] bg-gray-50 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Filter:</span>
                        <div className="relative w-full">
                            <select
                                value={activeContinent}
                                onChange={(e) => setActiveContinent(e.target.value)}
                                className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-[#EBE9FC] bg-white focus:outline-none focus:ring-1 focus:ring-[#3A31D8]/50 text-xs font-bold text-[#010104] appearance-none cursor-pointer"
                            >
                                {continents.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ArrowDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {filtered.length > 0 ? (
                            filtered.map(country => {
                                const isSelected = activeCountry === country.iso3.toLowerCase();
                                return (
                                    <button
                                        key={country.iso2}
                                        onClick={() => handleSelect(country)}
                                        disabled={isSelected}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                                            isSelected 
                                            ? "bg-[#3A31D8]/10 cursor-not-allowed" 
                                            : "hover:bg-gray-50 hover:shadow-sm"
                                        }`}
                                    >
                                        <img 
                                            src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`} 
                                            alt="flag"
                                            className="w-7 h-5 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0"
                                        />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className={`text-sm font-bold truncate ${isSelected ? "text-[#3A31D8]" : "text-[#010104]"}`}>
                                                {country.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {country.iso3} • {country.continent}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <MapPin size={14} className="ml-auto text-[#3A31D8]" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-xs font-semibold text-gray-500">
                                No countries found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
