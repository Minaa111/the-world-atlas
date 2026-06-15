import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download, Globe as GlobeIcon, BarChart2, PieChart, Table } from "lucide-react";
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { getDimensionsList, getDimensionsMap } from '../../shared/config/indicators';
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
import AnalysisSidebar from "../../shared/components/analysis/AnalysisSidebar";

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

const dimensionsMap = getDimensionsMap();

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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("globe");
    const [viewTab, setViewTab] = useState("time"); // 'time', 'radar', or 'scatter'
    const [activeDimension, setActiveDimension] = useState(() => localStorage.getItem('analysisActiveDimension') || "Gross National Income (GNI)");
    const [scatterX, setScatterX] = useState(() => localStorage.getItem('analysisScatterX') || "gni_per_capita");
    const [scatterY, setScatterY] = useState(() => localStorage.getItem('analysisScatterY') || "life_expectancy");
    const [hiddenCountries, setHiddenCountries] = useState(new Set());
    const [showForecast, setShowForecast] = useState(false); // Predict 5 years
    const [isExporting, setIsExporting] = useState(false);
    const [gridCols, setGridCols] = useState(2);
    const [hiddenColumns, setHiddenColumns] = useState(new Set());

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const dimensions = getDimensionsList();
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
        const countryToRemove = selectedCountries.find(c => c.name === name);
        setSelectedCountries(selectedCountries.filter(c => c.name !== name));
        if (countryToRemove) {
            setHiddenCountries(prev => {
                const next = new Set(prev);
                next.delete(countryToRemove.iso3);
                return next;
            });
        }
    };

    const toggleCountryVisibility = (iso3) => {
        setHiddenCountries(prev => {
            const next = new Set(prev);
            if (next.has(iso3)) next.delete(iso3);
            else next.add(iso3);
            return next;
        });
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

    const renderCanvas = () => {
        if (selectedCountries.length === 0) {
            return (
                <div className="flex-1 h-full flex items-center justify-center">
                    <div className="text-center z-10 flex flex-col items-center gap-4 py-32 bg-white w-full max-w-2xl rounded-3xl shadow-sm border border-[#EBE9FC]">
                        <div className="flex items-end justify-center h-32 gap-3 opacity-30">
                            <div className="w-10 bg-[#010104] h-12 rounded-t-sm"></div>
                            <div className="w-10 bg-[#010104] h-24 rounded-t-sm"></div>
                            <div className="w-10 bg-[#010104] h-16 rounded-t-sm"></div>
                            <div className="w-10 bg-[#010104] h-28 rounded-t-sm"></div>
                            <div className="w-10 bg-[#010104] h-20 rounded-t-sm"></div>
                        </div>
                        <h3 className="text-2xl font-bold text-[#010104] tracking-wide">Analysis Workspace</h3>
                        <p className="text-gray-500 font-medium">Select dimensions and entities from the sidebar to visualize insights.</p>
                    </div>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex-1 h-full flex items-center justify-center">
                    <div className="p-20 text-center font-bold text-gray-500 animate-pulse">Loading data...</div>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-white rounded-3xl shadow-sm border border-[#EBE9FC] flex flex-col overflow-hidden relative">
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
                        hiddenCountries={hiddenCountries}
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
                        hiddenCountries={hiddenCountries}
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
                            hiddenCountries={hiddenCountries}
                            gridCols={gridCols}
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
                            hiddenCountries={hiddenCountries}
                            gridCols={gridCols}
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
                        hiddenCountries={hiddenCountries}
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
                            hiddenCountries={hiddenCountries}
                            hiddenColumns={hiddenColumns}
                        />
                )}
            </div>
        );
    };

    return (
        <div className="h-screen flex overflow-hidden bg-[#F9F8FF]">
            <AnalysisSidebar 
                viewTab={viewTab} 
                setViewTab={setViewTab}
                selectedCountries={selectedCountries} 
                setSelectedCountries={setSelectedCountries}
                isAddModalOpen={isAddModalOpen} 
                setIsAddModalOpen={setIsAddModalOpen}
                removeCountry={removeCountry}
                showForecast={showForecast} 
                setShowForecast={setShowForecast}
                handleDownloadCSV={handleDownloadCSV} 
                handleDownloadPDF={handleDownloadPDF} 
                isExporting={isExporting}
                countryColors={countryColors} 
                chartData={chartData} 
                activeDimension={activeDimension} 
                formatValue={formatValue}
                hiddenCountries={hiddenCountries}
                toggleCountryVisibility={toggleCountryVisibility}
                gridCols={gridCols}
                setGridCols={setGridCols}
                hiddenColumns={hiddenColumns}
                setHiddenColumns={setHiddenColumns}
                dimensions={dimensions}
            />

            {/* Main Stage (Canvas) */}
            <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#F9F8FF]">
                <div id="analysis-workspace-content" className="flex-1 w-full h-full relative p-6 flex flex-col">
                    {renderCanvas()}
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
