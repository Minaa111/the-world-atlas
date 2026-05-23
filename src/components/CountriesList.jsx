import React, { useState } from "react";
import { countries } from "../data/countries";
import { Search } from "lucide-react";

export default function CountriesList({ onSelect, selectedCountries = [] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeContinent, setActiveContinent] = useState("All");

    const continents = ["All", ...new Set(countries.map(c => c.continent).filter(Boolean))];

    const filtered = countries.filter(c => {
        const matchesContinent = activeContinent === "All" || c.continent === activeContinent;
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchLower || 
                              c.name.toLowerCase().includes(searchLower) || 
                              (c.iso2 && c.iso2.toLowerCase().includes(searchLower)) ||
                              (c.iso3 && c.iso3.toLowerCase().includes(searchLower));
        return matchesContinent && matchesSearch;
    });

    return (
        <div className="flex flex-col w-full h-full bg-white text-[#010104]">
            {/* Header / Filters */}
            <div className="p-6 border-b border-[#EBE9FC] flex flex-col gap-4 sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 text-gray-400 pointer-events-none" size={20} />
                    <input 
                        type="text"
                        placeholder="Search by country name or ISO code..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#EBE9FC] bg-gray-50 focus:outline-none focus:border-[#010104] transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {continents.map(cont => (
                        <button
                            key={cont}
                            onClick={() => setActiveContinent(cont)}
                            className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                activeContinent === cont 
                                ? "bg-[#010104] text-[#EBE9FC] shadow-md" 
                                : "bg-[#EBE9FC]/50 text-[#010104] hover:bg-[#EBE9FC]"
                            }`}
                        >
                            {cont}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                    {filtered.map(country => {
                        const isSelected = selectedCountries.some(c => c.code === country.iso2);
                        return (
                            <div 
                                key={country.iso2 || country.name}
                                onClick={() => {
                                    if (onSelect && !isSelected) {
                                        onSelect({ name: country.name, code: country.iso2, iso3: country.iso3 });
                                    }
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                    isSelected 
                                    ? "border-[#010104] bg-[#010104]/5 opacity-50 cursor-not-allowed" 
                                    : "border-[#EBE9FC] bg-white hover:border-[#010104] hover:shadow-md cursor-pointer"
                                }`}
                            >
                                {country.iso2 ? (
                                    <img 
                                        src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`} 
                                        alt="flag"
                                        className="w-8 h-auto rounded shadow-sm border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-8 h-6 bg-gray-200 rounded border border-gray-100"></div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-bold text-[15px]">{country.name}</span>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                        {country.iso2} • {country.continent}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                            No countries found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
