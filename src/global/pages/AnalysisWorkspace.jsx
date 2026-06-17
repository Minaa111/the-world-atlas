import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download, Globe as GlobeIcon, BarChart2, PieChart, Table } from "lucide-react";
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { getDimensionsList, getDimensionsMap } from '../../shared/config/indicators';
import { motion, AnimatePresence } from 'framer-motion';
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

ChartJS.register(
    CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, 
    BarElement, ArcElement, Filler, Title, Tooltip, Legend
);

// Global ChartJS Styling (Glassmorphism Tooltips & Fonts)
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#9ca3af'; // gray-400
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.95)';
ChartJS.defaults.plugins.tooltip.titleColor = '#010104';
ChartJS.defaults.plugins.tooltip.bodyColor = '#4b5563';
ChartJS.defaults.plugins.tooltip.borderColor = '#EBE9FC';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.boxPadding = 6;
ChartJS.defaults.plugins.tooltip.usePointStyle = true;
ChartJS.defaults.plugins.tooltip.titleFont = { size: 13, weight: 'bold', family: "'Inter', sans-serif" };
ChartJS.defaults.plugins.tooltip.bodyFont = { size: 12, weight: '600', family: "'Inter', sans-serif" };

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
    
    // We import dimensionsMap here to validate localStorage because scatter keys must be valid labels
    const [scatterX, setScatterX] = useState(() => {
        const stored = localStorage.getItem('analysisScatterX');
        const map = getDimensionsMap();
        return (stored && map[stored]) ? stored : "GNI per capita";
    });
    const [scatterY, setScatterY] = useState(() => {
        const stored = localStorage.getItem('analysisScatterY');
        const map = getDimensionsMap();
        return (stored && map[stored]) ? stored : "Life Expectancy";
    });

    const [hiddenCountries, setHiddenCountries] = useState(new Set());
    const [showForecast, setShowForecast] = useState(false); // Predict 5 years
    const [isExporting, setIsExporting] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [gridCols, setGridCols] = useState(2);
    const [hiddenColumns, setHiddenColumns] = useState(new Set());

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Time-Lapse State
    const [playbackYear, setPlaybackYear] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);

    const dimensions = getDimensionsList();
    const defaultColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    const [customColors, setCustomColors] = useState(() => JSON.parse(localStorage.getItem('analysisCustomColors')) || {});

    const getEntityColor = (iso3, index) => customColors[iso3] || defaultColors[index % defaultColors.length];

    useEffect(() => {
        localStorage.setItem('analysisCustomColors', JSON.stringify(customColors));
    }, [customColors]);

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
        setIsPlaying(false);
    }, [viewTab]);

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

    useEffect(() => {
        if (Object.keys(chartData).length > 0) {
            const yearsSet = new Set();
            Object.values(chartData).forEach(cData => {
                cData.forEach(d => {
                    if (!d.is_forecast || showForecast) yearsSet.add(d.year);
                });
            });
            const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
            setAvailableYears(sortedYears);
            if (sortedYears.length > 0 && (!playbackYear || !sortedYears.includes(playbackYear))) {
                setPlaybackYear(sortedYears[sortedYears.length - 1]);
            }
        }
    }, [chartData, showForecast]);

    useEffect(() => {
        let interval;
        if (isPlaying && availableYears.length > 0) {
            interval = setInterval(() => {
                setPlaybackYear(prev => {
                    const currentIndex = availableYears.indexOf(prev);
                    if (currentIndex < availableYears.length - 1) {
                        return availableYears[currentIndex + 1];
                    } else {
                        setIsPlaying(false);
                        return prev;
                    }
                });
            }, 800); // 800ms per year
        }
        return () => clearInterval(interval);
    }, [isPlaying, availableYears]);

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
            if (!customColors[countryObj.iso3]) {
                setCustomColors(prev => ({
                    ...prev,
                    [countryObj.iso3]: defaultColors[selectedCountries.length % defaultColors.length]
                }));
            }
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
            setIsExportMenuOpen(false);
        }
    };

    const handleDownloadPNG = async () => {
        if (selectedCountries.length === 0) return;

        setIsExporting(true);
        try {
            const element = document.getElementById("analysis-workspace-content");
            if (!element) return;

            const canvases = element.querySelectorAll('canvas');
            const replacedImages = [];

            canvases.forEach(canvas => {
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png', 1.0);
                img.style.width = canvas.style.width;
                img.style.height = canvas.style.height;
                img.style.boxSizing = 'border-box';

                canvas.style.display = 'none';
                canvas.parentNode.insertBefore(img, canvas);
                replacedImages.push({ canvas, img });
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const renderCanvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: "#F9F8FF" });
            const imgData = renderCanvas.toDataURL('image/png');

            const link = document.createElement("a");
            link.download = `Inequality_Atlas_${viewTab}_Export.png`;
            link.href = imgData;
            link.click();

            replacedImages.forEach(({ canvas, img }) => {
                canvas.style.display = '';
                img.parentNode.removeChild(img);
            });

        } catch (error) {
            console.error("Error generating PNG", error);
            alert(`Error generating PNG: ${error.message || error}`);
        } finally {
            setIsExporting(false);
            setIsExportMenuOpen(false);
        }
    };

    const renderCanvas = () => {
        if (selectedCountries.length === 0) {
            return (
                <motion.div 
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 h-full flex items-center justify-center p-8"
                >
                    <div className="text-center z-10 flex flex-col items-center gap-6 py-24 px-12 bg-white/60 backdrop-blur-sm w-full max-w-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <LineChart size={40} className="text-indigo-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[#010104] tracking-tight mb-2">Blank Canvas</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">Your workspace is ready. Select entities from the sidebar or globe to begin your analysis.</p>
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 px-6 py-3 bg-[#010104] hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 outline-none flex items-center gap-2"
                        >
                            <Plus size={16} /> Add First Entity
                        </button>
                    </div>
                </motion.div>
            );
        }

        if (isLoading) {
            return (
                <motion.div 
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-4"
                >
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="font-bold text-gray-500 animate-pulse tracking-wide uppercase text-sm">Processing Data...</div>
                </motion.div>
            );
        }

        const viewNames = {
            'time': 'Time-Series Tracking',
            'bar': 'Snapshot Comparison',
            'radar': 'Multidimensional Assessment',
            'polar': 'Relative Scale Assessment',
            'scatter': 'Correlation Analysis',
            'table': 'Raw Data Matrix'
        };

        return (
            <motion.div 
                key="canvas-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full bg-white rounded-[2rem] shadow-sm border border-[#EBE9FC] flex flex-col overflow-hidden relative"
            >
                <div className="flex-1 relative min-h-0 bg-gray-50/30">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full absolute inset-0"
                        >
                {viewTab === "time" && (
                        <TimeSeriesView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            activeDimension={activeDimension}
                            dimensionsMap={dimensionsMap}
                            showForecast={showForecast}
                            getEntityColor={getEntityColor}
                            customColors={customColors}
                            formatValue={formatValue}
                            hiddenCountries={hiddenCountries}
                            playbackYear={playbackYear}
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
                        getEntityColor={getEntityColor}
                        formatValue={formatValue}
                        hiddenCountries={hiddenCountries}
                        playbackYear={playbackYear}
                    />
                )}
                {viewTab === "radar" && (
                        <RadarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            getEntityColor={getEntityColor}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                            hiddenCountries={hiddenCountries}
                            gridCols={gridCols}
                            hiddenColumns={hiddenColumns}
                            playbackYear={playbackYear}
                        />
                )}
                {viewTab === "polar" && (
                        <PolarView
                            entities={selectedCountries}
                            entityKeyField="iso3"
                            chartData={chartData}
                            dimensions={dimensions}
                            dimensionsMap={dimensionsMap}
                            getEntityColor={getEntityColor}
                            formatValue={formatValue}
                            globalMaxValues={globalMaxValues}
                            hiddenCountries={hiddenCountries}
                            gridCols={gridCols}
                            hiddenColumns={hiddenColumns}
                            playbackYear={playbackYear}
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
                        getEntityColor={getEntityColor}
                        formatValue={formatValue}
                        hiddenCountries={hiddenCountries}
                        playbackYear={playbackYear}
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
                            playbackYear={playbackYear}
                        />
                )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
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
                handleDownloadPNG={handleDownloadPNG}
                playbackYear={playbackYear}
                setPlaybackYear={setPlaybackYear}
                availableYears={availableYears}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                isExporting={isExporting}
                getEntityColor={getEntityColor} 
                setCustomColors={setCustomColors}
                chartData={chartData} 
                activeDimension={activeDimension} 
                setActiveDimension={setActiveDimension}
                scatterX={scatterX}
                setScatterX={setScatterX}
                scatterY={scatterY}
                setScatterY={setScatterY}
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
                    <AnimatePresence mode="wait">
                        {renderCanvas()}
                    </AnimatePresence>
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
