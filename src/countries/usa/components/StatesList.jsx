import React, { useState } from "react";
import { statesList } from "../data/states";

export default function StatesList({ onSelect, selectedStates = [] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filtered = statesList.filter(state => {
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchLower || 
                              state.name.toLowerCase().includes(searchLower) || 
                              state.iso2.toLowerCase().includes(searchLower);
        return matchesSearch;
    });

    return (
        <div className="flex flex-col w-full h-full bg-white text-[#010104]">
            {/* Header / Filters */}
            <div className="p-6 border-b border-[#EBE9FC] sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Search State</label>
                        <input 
                            type="text"
                            placeholder="Search by state name or code..."
                            className="w-full px-4 py-2.5 rounded-xl border border-[#EBE9FC] bg-[#F9F8FF] focus:outline-none focus:ring-2 focus:ring-[#3A31D8]/50 text-[#010104] placeholder:text-gray-400 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                    {filtered.map(state => {
                        const isSelected = selectedStates.some(s => s.name === state.name);
                        return (
                            <div 
                                key={state.iso2}
                                onClick={() => {
                                    if (onSelect && !isSelected) {
                                        onSelect({ name: state.name, code: state.iso2 });
                                    }
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                    isSelected 
                                    ? "border-[#010104] bg-[#010104]/5 opacity-50 cursor-not-allowed" 
                                    : "border-[#EBE9FC] bg-white hover:border-[#010104] hover:shadow-md cursor-pointer"
                                }`}
                            >
                                <img 
                                    src={`https://flagcdn.com/w40/us-${state.iso2.toLowerCase()}.png`} 
                                    alt="flag"
                                    className="w-8 h-auto rounded shadow-sm border border-gray-100 object-cover"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-[15px]">{state.name}</span>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                        US-{state.iso2}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                            No states found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
