import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe as GlobeIcon, Map as MapIcon, Loader2 } from 'lucide-react';
import * as d3 from 'd3';
import Globe from '../../global/components/Globe';
import Map from '../../global/components/Map';
import lookup from 'country-code-lookup';

const DIMENSIONS = [
    { id: 'gni', label: 'Gross National Income (GNI)', unit: 'B' },
    { id: 'gni_per_capita', label: 'GNI per capita', unit: '' },
    { id: 'gini', label: 'Gini Index', unit: '' },
    { id: 'life_expectancy', label: 'Life Expectancy', unit: 'Years' },
    { id: 'literacy_rate', label: 'Literacy Rate', unit: '%' },
    { id: 'homicide_rate', label: 'Intentional Homicide Rate', unit: '/100k' },
    { id: 'pm25', label: 'PM2.5 Air Pollution', unit: 'µg/m³' }
];

export default function Choropleth() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('globe');
    const [year, setYear] = useState(() => {
        const saved = localStorage.getItem('choroplethYear');
        return saved ? parseInt(saved, 10) : 2015;
    });
    const [yearInput, setYearInput] = useState(() => {
        const saved = localStorage.getItem('choroplethYear');
        return saved ? saved : '2015';
    });
    const [dimension, setDimension] = useState('gni');
    const [globalData, setGlobalData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('choroplethYear', year.toString());
    }, [year]);

    useEffect(() => {
        setLoading(true);
        // We use an abort controller to prevent race conditions if the user scrubs the slider fast
        const controller = new AbortController();
        
        fetch(`http://127.0.0.1:5000/api/data/global?year=${year}`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                setGlobalData(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Failed to fetch global data", err);
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [year]);

    const handleYearChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            setYear(val);
            setYearInput(String(val));
        }
    };

    const handleYearInputChange = (e) => {
        setYearInput(e.target.value);
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 1990 && val <= 2025) {
            setYear(val);
        }
    };

    // Calculate choropleth mappings
    const activeDimObj = DIMENSIONS.find(d => d.id === dimension);
    
    const validValues = Object.keys(globalData)
        .filter(key => {
            try {
                return lookup.byIso(key) || lookup.byCountry(key);
            } catch (e) {
                try {
                    return lookup.byCountry(key);
                } catch (err) {
                    return false;
                }
            }
        })
        .map(key => globalData[key][dimension])
        .filter(v => v !== null && v !== undefined);

    const minVal = validValues.length ? Math.min(...validValues) : 0;
    const maxVal = validValues.length ? Math.max(...validValues) : 100;

    // Use a single-hue blue scale as requested
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([minVal, maxVal]);

    const choroplethMapData = {};
    Object.keys(globalData).forEach(country => {
        const val = globalData[country][dimension];
        if (val !== null && val !== undefined) {
            choroplethMapData[country] = {
                value: val,
                color: colorScale(val),
                unit: activeDimObj.unit
            };
        }
    });

    return (
        <div className="w-full h-screen bg-white flex flex-col relative overflow-hidden text-[#010104]">
            {/* Header */}
            <div className="w-full z-10 p-6 flex items-center justify-between pointer-events-none">
                <button 
                    onClick={() => navigate('/global')}
                    className="flex items-center gap-2 bg-white text-[#010104] hover:bg-gray-50 px-5 py-3 rounded-full font-bold text-sm shadow-md transition-all pointer-events-auto border border-[#EBE9FC]"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
                
                {/* View Toggle */}
                <div className="flex bg-white rounded-full p-1 shadow-md pointer-events-auto border border-[#EBE9FC]">
                    <button 
                        onClick={() => setViewMode('globe')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${viewMode === 'globe' ? 'bg-[#010104] text-[#EBE9FC]' : 'text-gray-500 hover:text-[#010104]'}`}
                    >
                        <GlobeIcon size={18} /> 3D Globe
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${viewMode === 'map' ? 'bg-[#010104] text-[#EBE9FC]' : 'text-gray-500 hover:text-[#010104]'}`}
                    >
                        <MapIcon size={18} /> 2D Map
                    </button>
                </div>
                
                <div className="w-24"></div> {/* Spacer for balance */}
            </div>

            {/* Main Map Area */}
            <div className="flex-1 w-full relative z-0 min-h-0">
                {viewMode === 'globe' ? (
                    <Globe 
                        choroplethData={choroplethMapData} 
                        choroplethDimension={activeDimObj.label} 
                    />
                ) : (
                    <Map 
                        choroplethData={choroplethMapData} 
                        choroplethDimension={activeDimObj.label} 
                    />
                )}
            </div>

            {/* Bottom Controls */}
            <div className="w-[90%] max-w-6xl mx-auto mb-6 z-10 pointer-events-none flex flex-col gap-4">
                
                {/* Dimensions Bar */}
                <div className="flex justify-center flex-wrap gap-2 pointer-events-auto">
                    {DIMENSIONS.map(dim => {
                        const isActive = dimension === dim.id;
                        return (
                            <button
                                key={dim.id}
                                onClick={() => setDimension(dim.id)}
                                className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 shadow-sm border ${
                                    isActive 
                                        ? 'bg-[#010104] text-[#EBE9FC] border-[#010104] transform scale-105' 
                                        : 'bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300'
                                }`}
                            >
                                {dim.label}
                            </button>
                        );
                    })}
                </div>

                {/* Legend and Time Controls */}
                <div className="bg-white rounded-3xl p-5 shadow-xl border border-[#EBE9FC] pointer-events-auto flex items-center gap-6">
                    
                    {/* Time Slider */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>1990</span>
                            <div className="flex items-center gap-2">
                                <span>Year:</span>
                                <input 
                                    type="number" 
                                    min="1990" 
                                    max="2025"
                                    value={yearInput}
                                    onChange={handleYearInputChange}
                                    className="w-16 bg-[#F9F8FF] border border-[#EBE9FC] rounded-md px-2 py-1 text-center font-bold text-[#010104] outline-none focus:border-[#4f46e5]"
                                />
                            </div>
                            <span>2025</span>
                        </div>
                        <input 
                            type="range" 
                            min="1990" 
                            max="2025" 
                            value={year} 
                            onChange={handleYearChange}
                            className="w-full h-2 bg-[#EBE9FC] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                        />
                    </div>

                    <div className="w-[1px] h-12 bg-[#EBE9FC]"></div>

                    {/* Legend */}
                    <div className="w-96 flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>Low</span>
                            {loading && <Loader2 size={14} className="animate-spin text-[#2563eb]" />}
                            <span>High</span>
                        </div>
                        <div className="w-full h-3 rounded-full" style={{
                            background: `linear-gradient(to right, ${d3.interpolateBlues(0)}, ${d3.interpolateBlues(1)})`
                        }}></div>
                        <div className="flex justify-between text-xs font-bold">
                            <span>{Number(minVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeDimObj.unit}</span>
                            <span>{Number(maxVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeDimObj.unit}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
