import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, DollarSign, Heart, Shield, Leaf, Info } from 'lucide-react';
import { THEMATIC_PILLARS } from '../../config/indicators';

const ICON_MAP = {
    DollarSign,
    Heart,
    Shield,
    Leaf
};

export default function IndicatorSelector({ activeDimension, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Find current pillar info for the active dimension to style the trigger button
    const activePillar = THEMATIC_PILLARS.find(p => p.indicators.some(i => i.label === activeDimension));
    const ActiveIcon = activePillar ? ICON_MAP[activePillar.icon] : null;

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredPillars = THEMATIC_PILLARS.map(pillar => {
        return {
            ...pillar,
            indicators: pillar.indicators.filter(ind => 
                ind.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                ind.desc.toLowerCase().includes(searchTerm.toLowerCase())
            )
        };
    }).filter(pillar => pillar.indicators.length > 0);

    return (
        <div className="relative w-full max-w-sm" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm hover:border-indigo-200 transition-all text-left group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {ActiveIcon && (
                        <div className={`p-1.5 rounded-lg ${activePillar.bg} ${activePillar.color}`}>
                            <ActiveIcon size={16} />
                        </div>
                    )}
                    <span className="font-bold text-[#010104] truncate text-sm group-hover:text-indigo-600 transition-colors">
                        {activeDimension || 'Select an Indicator...'}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-[#EBE9FC] rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[500px]">
                    <div className="p-3 border-b border-[#EBE9FC] bg-gray-50/50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search indicators..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#EBE9FC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-2">
                        {filteredPillars.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No indicators found matching "{searchTerm}"
                            </div>
                        ) : (
                            filteredPillars.map(pillar => {
                                const PillarIcon = ICON_MAP[pillar.icon];
                                return (
                                    <div key={pillar.id} className="mb-4 last:mb-0">
                                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-lg">
                                            <PillarIcon size={14} className={pillar.color} />
                                            {pillar.label}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {pillar.indicators.map(ind => {
                                                const isActive = activeDimension === ind.label;
                                                return (
                                                    <button
                                                        key={ind.key}
                                                        onClick={() => {
                                                            onChange(ind.label);
                                                            setIsOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                        className={`group w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
                                                    >
                                                        <div 
                                                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
                                                            style={{ backgroundColor: ind.color }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className={`font-bold text-sm ${isActive ? 'text-indigo-700' : 'text-[#010104]'}`}>
                                                                {ind.label}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                                {ind.desc}
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-indigo-100 rounded-full">
                                                                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
