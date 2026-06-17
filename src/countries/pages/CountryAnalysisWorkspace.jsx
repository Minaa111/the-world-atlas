import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { countryRegistry } from '../config/countryRegistry';
import AnalysisSidebar from "../../shared/components/analysis/AnalysisSidebar";
import TimeSeriesView from "../../shared/components/analysis/TimeSeriesView";
import RadarView from "../../shared/components/analysis/RadarView";
import BarView from "../../shared/components/analysis/BarView";
import PolarView from "../../shared/components/analysis/PolarView";
import CorrelationView from "../../shared/components/analysis/CorrelationView";
import DataTableView from "../../shared/components/analysis/DataTableView";
import RegionList from "../components/RegionList";
import { LineChart, Plus } from "lucide-react";
import { motion } from "framer-motion";

// Shared chart.js registration happens in App or index normally, but ensure it's registered
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, 
    BarElement, ArcElement, Filler, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, 
    BarElement, ArcElement, Filler, Title, Tooltip, Legend
);

export default function CountryAnalysisWorkspace() {
    const { countryId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const config = countryRegistry[countryId];

    const [selectedRegions, setSelectedRegions] = useState(() => {
        let initial = [];
        const saved = localStorage.getItem(`${countryId}AnalysisSelectedRegions`);
        if (saved) {
            try {
                initial = JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        if (location.state?.initialRegion) {
            const region = location.state.initialRegion;
            const exists = initial.find(r => r.name === region.name);
            if (!exists) {
                initial.push(region);
            }
        }
        return initial;
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("map");
    const [viewTab, setViewTab] = useState("time");
    
    const [activeDimension, setActiveDimension] = useState(() => {
        return localStorage.getItem(`${countryId}AnalysisActiveDimension`) || (config ? config.dimensions[0] : "");
    });
    const [scatterX, setScatterX] = useState(() => {
        return localStorage.getItem(`${countryId}AnalysisScatterX`) || (config ? config.dimensions[0] : "");
    });
    const [scatterY, setScatterY] = useState(() => {
        return localStorage.getItem(`${countryId}AnalysisScatterY`) || (config ? config.dimensions[1] || config.dimensions[0] : "");
    });

    const [hiddenRegions, setHiddenRegions] = useState(new Set());
    const [showForecast, setShowForecast] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [gridCols, setGridCols] = useState(2);
    const [hiddenColumns, setHiddenColumns] = useState(new Set());

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [playbackYear, setPlaybackYear] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);

    const defaultColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    const [customColors, setCustomColors] = useState(() => JSON.parse(localStorage.getItem(`${countryId}AnalysisCustomColors`)) || {});

    useEffect(() => {
        if (!config) navigate('/country/aus');
    }, [config, navigate]);

    useEffect(() => {
        if (config) {
            localStorage.setItem(`${countryId}AnalysisCustomColors`, JSON.stringify(customColors));
        }
    }, [customColors, countryId, config]);

    useEffect(() => {
        if (config) {
            localStorage.setItem(`${countryId}AnalysisSelectedRegions`, JSON.stringify(selectedRegions));
        }
    }, [selectedRegions, countryId, config]);

    useEffect(() => {
        if (config) {
            localStorage.setItem(`${countryId}AnalysisActiveDimension`, activeDimension);
        }
    }, [activeDimension, countryId, config]);

    useEffect(() => {
        if (config) {
            localStorage.setItem(`${countryId}AnalysisScatterX`, scatterX);
        }
    }, [scatterX, countryId, config]);

    useEffect(() => {
        if (config) {
            localStorage.setItem(`${countryId}AnalysisScatterY`, scatterY);
        }
    }, [scatterY, countryId, config]);

    useEffect(() => {
        setIsPlaying(false);
    }, [viewTab]);

    useEffect(() => {
        if (location.state?.initialRegion) {
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (!config) return;

        if (selectedRegions.length === 0) {
            setChartData({});
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const regionNames = selectedRegions.map(r => r.name);
            const mockData = config.mockDataFn(regionNames, showForecast);
            setChartData(mockData);
            setIsLoading(false);
        }, 300);
    }, [selectedRegions, showForecast, config]);

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
            }, 800);
        }
        return () => clearInterval(interval);
    }, [isPlaying, availableYears]);

    if (!config) return null;

    const MapComponent = config.mapComponent;

    const getEntityColor = (name, index) => customColors[name] || defaultColors[index % defaultColors.length];

    const removeRegion = (name) => {
        setSelectedRegions(selectedRegions.filter(r => r.name !== name));
        setHiddenRegions(prev => {
            const next = new Set(prev);
            next.delete(name);
            return next;
        });
    };

    const handleAddRegion = (regionObj) => {
        const exists = selectedRegions.find(r => r.name === regionObj.name);
        if (!exists) {
            setSelectedRegions([...selectedRegions, regionObj]);
        }
        setIsAddModalOpen(false);
    };

    const toggleRegionVisibility = (name) => {
        setHiddenRegions(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const visibleRegions = selectedRegions.filter(r => !hiddenRegions.has(r.name));
    
    // We create a modified Map containing max values for radar charts
    const globalMaxValues = {};
    Object.values(config.dimensionsMap).forEach(dim => {
        globalMaxValues[dim.key] = dim.max;
    });

    const formatValue = (val) => {
        if (val === null || val === undefined) return val;
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="flex h-screen bg-[#F9F8FF] overflow-hidden">
            {/* Sidebar */}
            <AnalysisSidebar 
                viewTab={viewTab}
                setViewTab={setViewTab}
                selectedCountries={selectedRegions}
                setSelectedCountries={setSelectedRegions}
                activeDimension={activeDimension}
                setActiveDimension={setActiveDimension}
                hiddenCountries={hiddenRegions}
                toggleCountryVisibility={toggleRegionVisibility}
                removeCountry={removeRegion}
                setCustomColors={setCustomColors}
                chartData={chartData}
                dimensions={config.dimensions}
                dimensionsMap={config.dimensionsMap}
                formatValue={formatValue}
                setIsAddModalOpen={setIsAddModalOpen}
                showForecast={showForecast}
                setShowForecast={setShowForecast}
                isExporting={isExporting}
                setIsExporting={setIsExporting}
                gridCols={gridCols}
                setGridCols={setGridCols}
                hiddenColumns={hiddenColumns}
                setHiddenColumns={setHiddenColumns}
                scatterX={scatterX}
                setScatterX={setScatterX}
                scatterY={scatterY}
                setScatterY={setScatterY}
                getEntityColor={getEntityColor}
                playbackYear={playbackYear}
                setPlaybackYear={setPlaybackYear}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                availableYears={availableYears}
                entityKeyField="name" // Important for country scope vs global iso3
                getFlagUrl={config.getFlagUrl}
                onExit={() => navigate(`/country/${config.id}`)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                <div id="analysis-workspace-content" className="w-full flex-1 flex flex-col min-h-0 p-6 lg:p-8 overflow-y-auto">
                    {visibleRegions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-[#EBE9FC] text-center w-full max-w-lg"
                            >
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6">
                                    <LineChart size={32} />
                                </div>
                                <h3 className="text-xl font-black text-[#010104] mb-3">Blank Canvas</h3>
                                <p className="text-gray-500 mb-8 max-w-sm">
                                    Your workspace is ready. Select regions from the sidebar or map to begin your analysis.
                                </p>
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#010104] hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-lg shadow-black/10 mx-auto"
                                >
                                    <Plus size={18} />
                                    Add First Region
                                </button>
                            </motion.div>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="p-20 text-center font-bold text-gray-500 animate-pulse">Loading data...</div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {viewTab === "time" && (
                                <TimeSeriesView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    activeDimension={activeDimension}
                                    toggleDimension={setActiveDimension}
                                    dimensionsMap={config.dimensionsMap}
                                    showForecast={showForecast}
                                    getEntityColor={getEntityColor}
                                    formatValue={formatValue}
                                    playbackYear={playbackYear}
                                />
                            )}
                            {viewTab === "bar" && (
                                <BarView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    dimensionsMap={config.dimensionsMap}
                                    activeDimension={activeDimension}
                                    toggleDimension={setActiveDimension}
                                    getEntityColor={getEntityColor}
                                    formatValue={formatValue}
                                    playbackYear={playbackYear}
                                />
                            )}
                            {viewTab === "radar" && (
                                <RadarView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    dimensionsMap={config.dimensionsMap}
                                    getEntityColor={getEntityColor}
                                    formatValue={formatValue}
                                    globalMaxValues={globalMaxValues}
                                    gridCols={gridCols}
                                    playbackYear={playbackYear}
                                    hiddenColumns={hiddenColumns}
                                />
                            )}
                            {viewTab === "polar" && (
                                <PolarView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    dimensionsMap={config.dimensionsMap}
                                    getEntityColor={getEntityColor}
                                    formatValue={formatValue}
                                    globalMaxValues={globalMaxValues}
                                    gridCols={gridCols}
                                    playbackYear={playbackYear}
                                    hiddenColumns={hiddenColumns}
                                />
                            )}
                            {viewTab === "scatter" && (
                                <CorrelationView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    dimensionsMap={config.dimensionsMap}
                                    scatterX={scatterX}
                                    setScatterX={setScatterX}
                                    scatterY={scatterY}
                                    setScatterY={setScatterY}
                                    getEntityColor={getEntityColor}
                                    formatValue={formatValue}
                                    playbackYear={playbackYear}
                                />
                            )}
                            {viewTab === "table" && (
                                <DataTableView
                                    entities={visibleRegions}
                                    entityKeyField="name"
                                    chartData={chartData}
                                    dimensions={config.dimensions}
                                    dimensionsMap={config.dimensionsMap}
                                    formatValue={formatValue}
                                    hiddenColumns={hiddenColumns}
                                    playbackYear={playbackYear}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Region Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010104]/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden w-[85vw] h-[85vh] max-w-[1400px]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#EBE9FC] flex justify-between items-center bg-white">
                            <div className="flex gap-4 bg-[#EBE9FC]/30 p-1 rounded-xl">
                                <button
                                    onClick={() => setModalTab("map")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "map" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    2D Map
                                </button>
                                <button
                                    onClick={() => setModalTab("list")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "list" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    List View
                                </button>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-gray-500 hover:text-[#010104] hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-hidden relative bg-[#F9F8FF]">
                            {modalTab === "map" ? (
                                <div className="absolute inset-0">
                                    <MapComponent
                                        onStateSelect={handleAddRegion}
                                        selectedStates={selectedRegions}
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0 border border-[#EBE9FC] rounded-2xl overflow-hidden shadow-sm m-4">
                                    <RegionList
                                        onSelect={handleAddRegion}
                                        selectedRegions={selectedRegions}
                                        regions={config.regions}
                                        regionCodePrefix={config.regionCodePrefix}
                                        getFlagUrl={config.getFlagUrl}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
