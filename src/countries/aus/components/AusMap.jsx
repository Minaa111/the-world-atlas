import React from 'react';
import { ausStatesList } from '../data/ausStates';

export default function AusMap({ selectedStates = [], onStateSelect, choroplethData, choroplethDimension }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8 overflow-auto">
            <h2 className="text-xl font-bold text-gray-400 mb-6 uppercase tracking-widest">Australia States Map (Mock)</h2>
            <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                {ausStatesList.map(state => {
                    const isSelected = selectedStates.some(s => s.name === state.name);
                    const cData = choroplethData && choroplethData[state.name];
                    const bgColor = cData ? cData.color : (isSelected ? '#bfdbfe' : '#EBE9FC');
                    const borderColor = isSelected ? '#2563eb' : '#010104';

                    return (
                        <button
                            key={state.name}
                            onClick={() => onStateSelect({ name: state.name })}
                            className="relative flex flex-col items-center justify-center w-32 h-32 rounded-2xl shadow-sm transition-transform hover:scale-105 border-2 outline-none group"
                            style={{ backgroundColor: bgColor, borderColor: borderColor }}
                        >
                            <img src={`https://flagcdn.com/w40/au-${state.iso2.toLowerCase()}.png`} alt="flag" className="w-8 mb-2 rounded shadow-sm" />
                            <span className="font-bold text-sm text-center px-2 text-[#010104]">{state.name}</span>
                            {cData && (
                                <div className="absolute -top-3 bg-[#010104] text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {choroplethDimension}: {Number(cData.value).toLocaleString()} {cData.unit}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
