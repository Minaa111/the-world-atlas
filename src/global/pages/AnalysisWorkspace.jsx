import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download, Globe as GlobeIcon, BarChart2, PieChart, Table } from "lucide-react";
import axios from 'axios';
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
import Map from "../components/Map";
import CountriesList from "../components/CountriesList";
import Globe from "../components/Globe";

import TimeSeriesView from "../../shared/components/analysis/TimeSeriesView";
import RadarView from "../../shared/components/analysis/RadarView";
import BarView from "../../shared/components/analysis/BarView";
import PolarView from "../../shared/components/analysis/PolarView";
import CorrelationView from "../../shared/components/analysis/CorrelationView";
import DataTableView from "../../shared/components/analysis/DataTableView";

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

const dimensionsMap = {
    "Gini Index": { key: "gini", label: "Gini Index", color: "#10b981" },
    "Life Expectancy": { key: "life_expectancy", label: "Life Expectancy", color: "#3b82f6" },
    "Intentional Homicide Rate": { key: "homicide_rate", label: "Intentional Homicide Rate", color: "#ef4444" },
    "Literacy Rate": { key: "literacy_rate", label: "Literacy Rate", color: "#f59e0b" },
    "PM2.5 Air Pollution": { key: "pm25", label: "PM2.5 Air Pollution", color: "#8b5cf6" },
    "Gross National Income (GNI)": { key: "gni", label: "Gross National Income (GNI)", color: "#ec4899" },
    "GNI per capita": { key: "gni_per_capita", label: "GNI per capita", color: "#14b8a6" }
};

const formatValue = (val) => {
    if (val === null || val === undefined) return val;
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const globalMaxValues = {
    "gini": 100,
    "life_expectancy": 90,
    "homicide_rate": 100,
    "literacy_rate": 100,
    "pm25": 100,
    "gni": 30000000000000, // 30 Trillion
    "gni_per_capita": 150000
};

export default function Analysis() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCountries, setSelectedCountries] = useState(() => {
        let initial = [];
        const saved = localStorage.getItem('analysisSelectedCountries');
        if (saved) {
            try {
                initial = JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        if (location.state?.initialCountry) {
            const country = location.state.initialCountry;
            const exists = initial.find(c => c.name === country.name);
            if (!exists) {
                initial.push(country);
            }
        }
        return initial;
    });
    const [activeDimension, setActiveDimension] = useState(() => {
        return localStorage.getItem('analysisActiveDimension') || "Gross National Income (GNI)";
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("globe");
    const [viewTab, setViewTab] = useState("time"); // 'time', 'radar', or 'scatter'
    const [scatterX, setScatterX] = useState(() => localStorage.getItem('analysisScatterX') || "GNI per capita");
    const [scatterY, setScatterY] = useState(() => localStorage.getItem('analysisScatterY') || "Gross National Income (GNI)");
    const [showForecast, setShowForecast] = useState(false); // Predict 5 years
    const [isExporting, setIsExporting] = useState(false);

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const dimensions = ["Gross National Income (GNI)", "GNI per capita", "Gini Index", "Life Expectancy", "Literacy Rate", "Intentional Homicide Rate", "PM2.5 Air Pollution"];
    const countryColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    useEffect(() => {
        localStorage.setItem('analysisSelectedCountries', JSON.stringify(selectedCountries));
    }, [selectedCountries]);

    useEffect(() => {
        localStorage.setItem('analysisActiveDimension', activeDimension);
    }, [activeDimension]);

    useEffect(() => {
        localStorage.setItem('analysisScatterX', scatterX);
    }, [scatterX]);

    useEffect(() => {
        localStorage.setItem('analysisScatterY', scatterY);
    }, [scatterY]);

    useEffect(() => {
        if (location.state?.initialCountry) {
            // Clear the location state so we don't re-add on re-renders
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        let ignore = false;
        const fetchChartData = async () => {
            if (selectedCountries.length === 0) {
                setChartData({});
                return;
            }
            setIsLoading(true);
            const iso3Codes = selectedCountries.map(c => c.iso3).join(',');
            try {
                const response = await axios.get(`/api/data/compare?countries=${iso3Codes}&forecast=${showForecast}`);
                if (!ignore) {
                    setChartData(response.data);
                }
            } catch (error) {
                if (!ignore) {
                    console.error("Error fetching data:", error);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };
        fetchChartData();
        return () => {
            ignore = true;
        };
    }, [selectedCountries, showForecast]);

    const removeCountry = (name) => {
        setSelectedCountries(selectedCountries.filter(c => c.name !== name));
    };

    const toggleDimension = (dim) => {
        setActiveDimension(dim);
    };

    const handleAddCountry = (countryObj) => {
        const exists = selectedCountries.find(c => c.name === countryObj.name);
        if (!exists) {
            setSelectedCountries([...selectedCountries, countryObj]);
        }
        setIsAddModalOpen(false);
    };

    const getLatestValues = (countryIso3) => {
        const cData = chartData[countryIso3] || [];
        const sorted = [...cData].filter(d => !d.is_forecast).sort((a, b) => b.year - a.year);

        const latest = {};
        dimensions.forEach(dim => {
            const key = dimensionsMap[dim].key;
            const record = sorted.find(d => d[key] !== null && d[key] !== undefined);
            latest[key] = record ? record[key] : null;
        });
        return latest;
    };

    const handleDownloadCSV = () => {
        if (selectedCountries.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        const cols = ["Country", "ISO3", "Year", "Is_Forecast"];
        dimensions.forEach(dim => cols.push(dim));
        csvContent += cols.join(",") + "\n";

        selectedCountries.forEach(country => {
            const cData = chartData[country.iso3] || [];
            cData.forEach(row => {
                if (!showForecast && row.is_forecast) return;

                const rowData = [
                    `"${country.name}"`,
                    country.iso3,
                    row.year,
                    row.is_forecast ? "Yes" : "No"
                ];

                dimensions.forEach(dim => {
                    const key = dimensionsMap[dim].key;
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
        if (selectedCountries.length === 0) return;

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
        if (selectedCountries.length === 0) {
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
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            dimensionsMap={dimensionsMap}
                            showForecast={showForecast}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "bar" && (
                        <BarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            activeDimension={activeDimension}
                            toggleDimension={toggleDimension}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "radar" && (
                        <RadarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            entityColors={countryColors}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                        />
                    )}
                    {viewTab === "polar" && (
                        <PolarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            entityColors={countryColors}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                        />
                    )}
                    {viewTab === "scatter" && (
                        <CorrelationView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            scatterX={scatterX}
                            setScatterX={setScatterX}
                            scatterY={scatterY}
                            setScatterY={setScatterY}
                            entityColors={countryColors}
                            formatValue={formatValue}
                        />
                    )}
                    {viewTab === "table" && (
                        <DataTableView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
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
                            onClick={() => navigate('/global')}
                            className="text-[#010104] hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Countries Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedCountries.map(country => (
                            <div key={country.name} className="flex items-center gap-2 bg-[#010104] text-[#EBE9FC] px-4 py-2 rounded-full font-bold text-sm shadow-md group transition-all">
                                {country.code && (
                                    <img
                                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                        alt="flag"
                                        className="w-5 h-auto rounded-[2px]"
                                    />
                                )}
                                <span>{country.name}</span>
                                <button
                                    onClick={() => removeCountry(country.name)}
                                    className="ml-1 opacity-60 hover:opacity-100 hover:text-white transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#EBE9FC] text-[#010104] hover:bg-[#dcd9fa] px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span>Add Country</span>
                        </button>
                    </div>

                </div>

                {/* Main Workspace */}
                <div className="w-full flex justify-center">
                    {renderWorkspace()}
                </div>

            </div>

            {/* Add Country Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010104]/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '85vw', height: '85vh', maxWidth: '1400px' }}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#EBE9FC] flex justify-between items-center bg-white">
                            <div className="flex gap-4 bg-[#EBE9FC]/30 p-1 rounded-xl">
                                <button
                                    onClick={() => setModalTab("globe")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "globe" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <GlobeIcon size={18} /> 3D Globe
                                </button>
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
                            {modalTab === "globe" ? (
                                <div className="absolute inset-0">
                                    <Globe
                                        onCountrySelect={handleAddCountry}
                                        selectedCountries={selectedCountries}
                                    />
                                </div>
                            ) : modalTab === "map" ? (
                                <div className="absolute inset-0">
                                    <Map
                                        onCountrySelect={handleAddCountry}
                                        selectedCountries={selectedCountries}
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0">
                                    <CountriesList
                                        onSelect={handleAddCountry}
                                        selectedCountries={selectedCountries}
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
