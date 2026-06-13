import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download, Globe as GlobeIcon, BarChart2, PieChart, Table } from "lucide-react";
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Radar, Scatter, Bar, PolarArea } from 'react-chartjs-2';
import USMap from "../components/USMap";
import StatesList from "../components/StatesList";
import { usDimensionsMap, usDimensions, getMockUSData } from "../data/usMockData";
import { statesList } from "../data/states";

import TimeSeriesView from "../../../shared/components/analysis/TimeSeriesView";
import RadarView from "../../../shared/components/analysis/RadarView";
import BarView from "../../../shared/components/analysis/BarView";
import PolarView from "../../../shared/components/analysis/PolarView";
import CorrelationView from "../../../shared/components/analysis/CorrelationView";
import DataTableView from "../../../shared/components/analysis/DataTableView";

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const formatValue = (val) => {
    if (val === null || val === undefined) return val;
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const usGlobalMaxValues = {};
Object.values(usDimensionsMap).forEach(dim => {
    usGlobalMaxValues[dim.key] = dim.max;
});

export default function StateAnalysisWorkspace() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedStates, setSelectedStates] = useState(() => {
        let initial = [];
        const saved = localStorage.getItem('usAnalysisSelectedStates');
        if (saved) {
            try {
                initial = JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        if (location.state?.initialState) {
            const stateObj = location.state.initialState;
            const exists = initial.find(s => s.name === stateObj.name);
            if (!exists) {
                initial.push(stateObj);
            }
        }
        return initial;
    });
    const [activeDimension, setActiveDimension] = useState(() => {
        return localStorage.getItem('usAnalysisActiveDimension') || "Median Income";
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("map");
    const [viewTab, setViewTab] = useState("time");
    const [scatterX, setScatterX] = useState(() => localStorage.getItem('usAnalysisScatterX') || "Median Income");
    const [scatterY, setScatterY] = useState(() => localStorage.getItem('usAnalysisScatterY') || "Poverty Rate");
    const [showForecast, setShowForecast] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const stateColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    useEffect(() => {
        localStorage.setItem('usAnalysisSelectedStates', JSON.stringify(selectedStates));
    }, [selectedStates]);

    useEffect(() => {
        localStorage.setItem('usAnalysisActiveDimension', activeDimension);
    }, [activeDimension]);

    useEffect(() => {
        localStorage.setItem('usAnalysisScatterX', scatterX);
    }, [scatterX]);

    useEffect(() => {
        localStorage.setItem('usAnalysisScatterY', scatterY);
    }, [scatterY]);

    useEffect(() => {
        if (location.state?.initialState) {
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (selectedStates.length === 0) {
            setChartData({});
            return;
        }
        setIsLoading(true);
        // Use Mock Data
        setTimeout(() => {
            const mockData = getMockUSData(selectedStates.map(s => s.name), showForecast);
            setChartData(mockData);
            setIsLoading(false);
        }, 300);
    }, [selectedStates, showForecast]);

    const removeState = (name) => {
        setSelectedStates(selectedStates.filter(s => s.name !== name));
    };

    const toggleDimension = (dim) => {
        setActiveDimension(dim);
    };

    const handleAddState = (stateObj) => {
        const exists = selectedStates.find(s => s.name === stateObj.name);
        if (!exists) {
            setSelectedStates([...selectedStates, stateObj]);
        }
        setIsAddModalOpen(false);
    };

    const getLatestValues = (stateName) => {
        const sData = chartData[stateName] || [];
        const sorted = [...sData].filter(d => !d.is_forecast).sort((a, b) => b.year - a.year);

        const latest = {};
        usDimensions.forEach(dim => {
            const key = usDimensionsMap[dim].key;
            const record = sorted.find(d => d[key] !== null && d[key] !== undefined);
            latest[key] = record ? record[key] : null;
        });
        return latest;
    };

    const handleDownloadCSV = () => {
        if (selectedStates.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        const cols = ["State", "ISO3", "Year", "Is_Forecast"];
        usDimensions.forEach(dim => cols.push(dim));
        csvContent += cols.join(",") + "\n";

        selectedStates.forEach(state => {
            const sData = chartData[state.name] || [];
            sData.forEach(row => {
                if (!showForecast && row.is_forecast) return;

                const rowData = [
                    `"${state.name}"`,
                    state.name,
                    row.year,
                    row.is_forecast ? "Yes" : "No"
                ];

                usDimensions.forEach(dim => {
                    const key = usDimensionsMap[dim].key;
                    rowData.push(row[key] !== null && row[key] !== undefined ? row[key] : "");
                });

                csvContent += rowData.join(",") + "\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inequality_atlas_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = async () => {
        if (selectedStates.length === 0) return;

        setIsExporting(true);
        try {
            const element = document.getElementById("analysis-workspace-content");
            if (!element) return;

            // Temporary workaround: Convert ChartJS canvases to images before rendering
            const canvases = element.querySelectorAll('canvas');
            const replacedImages = [];

            canvases.forEach(canvas => {
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.style.width = canvas.style.width;
                img.style.height = canvas.style.height;
                img.style.boxSizing = 'border-box';

                // Hide canvas and insert img
                canvas.style.display = 'none';
                canvas.parentNode.insertBefore(img, canvas);

                replacedImages.push({ canvas, img });
            });

            // Small delay to ensure images are inserted in the DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            const renderCanvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#F9F8FF" });
            const imgData = renderCanvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: renderCanvas.width > renderCanvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [renderCanvas.width, renderCanvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, renderCanvas.width, renderCanvas.height);
            pdf.save(`Inequality_Atlas_${viewTab}_Report.pdf`);

            // Revert back to canvases
            replacedImages.forEach(({ canvas, img }) => {
                canvas.style.display = '';
                img.parentNode.removeChild(img);
            });

        } catch (error) {
            console.error("Error generating PDF", error);
            alert(`Error generating PDF: ${error.message || error}\n\nPlease share this error message!`);
        } finally {
            setIsExporting(false);
        }
    };

    const renderWorkspace = () => {
        if (selectedStates.length === 0) {
            return (
                <div className="text-center z-10 flex flex-col items-center gap-4 py-32 bg-white w-full rounded-3xl shadow-sm border border-[#EBE9FC]">
                    <div className="flex items-end justify-center h-32 gap-3 opacity-30">
                        <div className="w-10 bg-[#010104] h-12 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-24 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-16 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-28 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-20 rounded-t-sm"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#010104] tracking-wide">Analysis Workspace</h3>
                    <p className="text-gray-500 font-medium">Select dimensions and countries to visualize insights.</p>
                </div>
            );
        }

        if (isLoading) {
            return <div className="p-20 text-center font-bold text-gray-500 animate-pulse w-full">Loading data...</div>;
        }

        return (
            <div className="w-full flex flex-col gap-6">
                {/* View Tabs & Actions */}
                <div className={`sticky top-0 z-40 bg-[#F9F8FF] flex justify-between items-center px-8 py-4 -mt-4 border-b ${viewTab === 'time' || viewTab === 'bar' ? 'border-transparent' : 'border-[#EBE9FC]'}`}>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setViewTab("time")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "time" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <LineChart size={18} /> Time Series
                        </button>
                        <button
                            onClick={() => setViewTab("bar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "bar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <BarChart2 size={18} /> Bar Chart
                        </button>
                        <button
                            onClick={() => setViewTab("radar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "radar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <Hexagon size={18} /> Radar View
                        </button>
                        <button
                            onClick={() => setViewTab("polar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "polar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <PieChart size={18} /> Polar Area
                        </button>
                        <button
                            onClick={() => setViewTab("scatter")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "scatter" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="2" /><circle cx="12" cy="11" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="16" cy="18" r="2" /><circle cx="7" cy="8" r="2" /></svg> Correlation
                        </button>
                        <button
                            onClick={() => setViewTab("table")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "table" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <Table size={18} /> Data Table
                        </button>
                    </div>

                    {/* AI Forecast & Download */}
                    <div className="flex gap-4">
                        {viewTab === "table" && (
                            <button
                                onClick={handleDownloadCSV}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm border bg-white text-gray-500 border-[#EBE9FC] hover:border-gray-300 hover:text-[#010104]"
                            >
                                <Download size={18} /> Download CSV
                            </button>
                        )}

                        {viewTab === "time" && (
                            <button
                                onClick={() => setShowForecast(!showForecast)}
                                className={`group flex justify-center items-center gap-2 px-5 py-3 w-[220px] rounded-xl font-bold text-[14px] transition-all shadow-sm border ${showForecast ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : "bg-white text-gray-500 border-[#EBE9FC] hover:border-indigo-200 hover:text-indigo-600"}`}
                            >
                                <Sparkles size={18} className={`transition-colors ${showForecast ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600"}`} />
                                {showForecast ? "5-Year Forecast Active" : "Enable AI Forecast"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Render Selected View */}
                <div id="analysis-workspace-content" className="w-full bg-[#F9F8FF] rounded-3xl pb-4">
                    {viewTab === "time" && (
                        <TimeSeriesView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            dimensionsMap={usDimensionsMap}
                            showForecast={showForecast}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "bar" && (
                        <BarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "radar" && (
                        <RadarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            entityColors={stateColors}
                            formatValue={formatValue}
                            globalMaxValues={usGlobalMaxValues}
                        />
                    )}
                    {viewTab === "polar" && (
                        <PolarView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            entityColors={stateColors}
                            formatValue={formatValue}
                            globalMaxValues={usGlobalMaxValues}
                        />
                    )}
                    {viewTab === "scatter" && (
                        <CorrelationView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            scatterX={scatterX}
                            setScatterX={setScatterX}
                            scatterY={scatterY}
                            setScatterY={setScatterY}
                            entityColors={stateColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "table" && (
                        <DataTableView
                            entities={selectedStates}
                            entityKeyField="name"
                            chartData={chartData}
                            dimensions={usDimensions}
                            dimensionsMap={usDimensionsMap}
                            formatValue={formatValue}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-12 px-6 flex flex-col items-center bg-[#F9F8FF]">
            <div className="w-[90vw] max-w-[1600px] flex flex-col gap-8">

                {/* Header Section (Light Mode) */}
                <div className="flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-sm border border-[#EBE9FC]">
                    <div className="flex justify-between items-center w-full">
                        <h1 className="text-4xl font-bold text-[#010104] tracking-tight">Analysis</h1>
                        <button
                            onClick={() => navigate('/country/usa')}
                            className="text-[#010104] hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Countries Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedStates.map(state => {
                            const stateObj = statesList.find(s => s.name === state.name);
                            return (
                                <div key={state.name} className="flex items-center gap-2 bg-[#010104] text-[#EBE9FC] px-4 py-2 rounded-full font-bold text-sm shadow-md group transition-all">
                                    {stateObj && <img src={`https://flagcdn.com/w40/us-${stateObj.iso2.toLowerCase()}.png`} alt="flag" className="w-5 h-auto rounded-sm object-cover" />}
                                    <span>{state.name}</span>
                                    <button
                                        onClick={() => removeState(state.name)}
                                        className="ml-1 opacity-60 hover:opacity-100 hover:text-white transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#EBE9FC] text-[#010104] hover:bg-[#dcd9fa] px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span>Add State</span>
                        </button>
                    </div>

                </div>

                {/* Main Workspace */}
                <div className="w-full flex justify-center">
                    {renderWorkspace()}
                </div>

            </div>

            {/* Add State Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010104]/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '85vw', height: '85vh', maxWidth: '1400px' }}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#EBE9FC] flex justify-between items-center bg-white">
                            <div className="flex gap-4 bg-[#EBE9FC]/30 p-1 rounded-xl">
                                <button
                                    onClick={() => setModalTab("map")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "map" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <MapIcon size={18} /> 2D Map
                                </button>
                                <button
                                    onClick={() => setModalTab("list")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "list" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <List size={18} /> List View
                                </button>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-gray-500 hover:text-[#010104] hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-hidden relative bg-[#F9F8FF]">
                            {modalTab === "map" ? (
                                <div className="absolute inset-0">
                                    <USMap
                                        onStateSelect={handleAddState}
                                        selectedStates={selectedStates}
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0 border border-[#EBE9FC] rounded-2xl overflow-hidden shadow-sm m-4">
                                    <StatesList
                                        onSelect={handleAddState}
                                        selectedStates={selectedStates}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
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
        </div>
    );
}
