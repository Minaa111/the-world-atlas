import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, DollarSign, Heart, Shield, Leaf } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { THEMATIC_PILLARS } from '../../config/indicators';

const ICON_MAP = {
    DollarSign,
    Heart,
    Shield,
    Leaf
};

export default function IndicatorSelector({ activeDimension, onChange }) {
    const [searchTerm, setSearchTerm] = useState('');

    const activePillar = THEMATIC_PILLARS.find(p => p.indicators.some(i => i.label === activeDimension));
    const ActiveIcon = activePillar ? ICON_MAP[activePillar.icon] : null;

    const filteredPillars = useMemo(() => {
        return THEMATIC_PILLARS.map(pillar => ({
            ...pillar,
            indicators: pillar.indicators.filter(ind => 
                ind.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                ind.desc.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(pillar => pillar.indicators.length > 0);
    }, [searchTerm]);

    return (
        <Listbox value={activeDimension} onChange={onChange}>
            <div className="relative w-full max-w-sm">
                <Listbox.Button className="relative w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm hover:border-indigo-300 transition-colors text-left group focus:outline-none">
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
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                    </span>
                </Listbox.Button>

                <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setSearchTerm('')}
                >
                    {/* Position dropdown above the button since it's at the bottom of the sidebar */}
                    <Listbox.Options className="absolute z-[100] bottom-full mb-2 w-full overflow-hidden rounded-2xl bg-white text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm border border-[#EBE9FC] flex flex-col max-h-[400px]">
                        <div className="p-3 border-b border-[#EBE9FC] bg-gray-50/50 shrink-0">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search indicators..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#EBE9FC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    onClick={(e) => e.stopPropagation()} // Prevent listbox from closing when clicking input
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
                                                {pillar.indicators.map(ind => (
                                                    <Listbox.Option
                                                        key={ind.key}
                                                        value={ind.label}
                                                        className={({ active }) =>
                                                            `group w-full flex items-start gap-3 p-3 rounded-xl cursor-default select-none transition-all ${
                                                                active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                                                            }`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <div 
                                                                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
                                                                    style={{ backgroundColor: ind.color }}
                                                                />
                                                                <div className="flex-1">
                                                                    <div className={`font-bold text-sm ${selected ? 'text-indigo-700' : 'text-[#010104]'}`}>
                                                                        {ind.label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                                        {ind.desc}
                                                                    </div>
                                                                </div>
                                                                {selected && (
                                                                    <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-indigo-100 rounded-full">
                                                                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}
