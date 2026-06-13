import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import * as d3 from 'd3';
import USMap from '../components/USMap';
import { usDimensionsMap, usDimensions, getMockUSData } from '../data/usMockData';

// Generate a list of state names for mock data
const STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export default function USAChoropleth() {
    const navigate = useNavigate();
    const [dimension, setDimension] = useState(usDimensions[0]);
    const [year, setYear] = useState(2023);
    const [yearInput, setYearInput] = useState('2023');
    const [stateData, setStateData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Simulate network request for mock data
        setTimeout(() => {
            const mock = getMockUSData(STATES);
            const dataForYear = {};
            Object.keys(mock).forEach(state => {
                const stateRecords = mock[state];
                // Find the record for the selected year
                const record = stateRecords.find(r => r.year === year && !r.is_forecast);
                if (record) {
                    dataForYear[state] = record;
                }
            });
            setStateData(dataForYear);
            setLoading(false);
        }, 300);
    }, [year]);

    const handleYearChange = (e) => {
        const val = parseInt(e.target.value);
        setYear(val);
        setYearInput(val.toString());
    };

    const handleYearInputChange = (e) => {
        setYearInput(e.target.value);
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 2010 && val <= 2023) {
            setYear(val);
        }
    };

    // Calculate choropleth mappings
    const activeDimObj = usDimensionsMap[dimension];
    
    const validValues = Object.keys(stateData)
        .map(state => stateData[state][activeDimObj.key])
        .filter(v => v !== null && v !== undefined);

    const minVal = validValues.length ? Math.min(...validValues) : 0;
    const maxVal = validValues.length ? Math.max(...validValues) : 100;

    // Single-hue blue scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([minVal, maxVal]);

    const choroplethMapData = {};
    Object.keys(stateData).forEach(state => {
        const val = stateData[state][activeDimObj.key];
        if (val !== null && val !== undefined) {
            choroplethMapData[state] = {
                value: val,
                color: colorScale(val),
                unit: activeDimObj.unit || ''
            };
        }
    });

    return (
        <div className="w-full h-screen bg-white flex flex-col relative overflow-hidden text-[#010104]">
            {/* Header */}
            <div className="w-full z-10 p-6 flex items-center justify-between pointer-events-none">
                <button 
                    onClick={() => navigate('/country/usa')}
                    className="flex items-center gap-2 bg-white text-[#010104] hover:bg-gray-50 px-5 py-3 rounded-full font-bold text-sm shadow-md transition-all pointer-events-auto border border-[#EBE9FC]"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
                
                <div className="w-24"></div> {/* Spacer for balance */}
            </div>

            {/* Main Map Area */}
            <div className="flex-1 w-[90%] max-w-[1400px] mx-auto relative z-0 min-h-0 flex justify-center items-center">
                <USMap 
                    choroplethData={choroplethMapData} 
                    choroplethDimension={dimension} 
                    onStateSelect={(stateObj) => {
                        navigate('/country/usa/analysis', { state: { initialState: stateObj } });
                    }}
                />
            </div>

            {/* Bottom Controls */}
            <div className="w-[90%] max-w-6xl mx-auto mb-6 z-10 pointer-events-none flex flex-col gap-4">
                
                {/* Dimensions Bar */}
                <div className="flex justify-center flex-wrap gap-2 pointer-events-auto">
                    {usDimensions.map(dim => {
                        const isActive = dimension === dim;
                        return (
                            <button
                                key={dim}
                                onClick={() => setDimension(dim)}
                                className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 shadow-sm border ${
                                    isActive 
                                        ? 'bg-[#010104] text-[#EBE9FC] border-[#010104] transform scale-105' 
                                        : 'bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300'
                                }`}
                            >
                                {dim}
                            </button>
                        );
                    })}
                </div>

                {/* Legend and Time Controls */}
                <div className="bg-white rounded-3xl p-5 shadow-xl border border-[#EBE9FC] pointer-events-auto flex items-center gap-6">
                    
                    {/* Time Slider */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                            <span>2010</span>
                            <div className="flex items-center gap-2">
                                <span>Year:</span>
                                <input 
                                    type="number" 
                                    min="2010" 
                                    max="2023"
                                    value={yearInput}
                                    onChange={handleYearInputChange}
                                    className="w-16 bg-[#F9F8FF] border border-[#EBE9FC] rounded-md px-2 py-1 text-center font-bold text-[#010104] outline-none focus:border-[#4f46e5]"
                                />
                            </div>
                            <span>2023</span>
                        </div>
                        <input 
                            type="range" 
                            min="2010" 
                            max="2023" 
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
