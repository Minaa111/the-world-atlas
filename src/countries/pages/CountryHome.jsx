import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { countryRegistry } from "../config/countryRegistry";
import RegionList from "../components/RegionList";
import { MapPin, ArrowRight, Activity, Wind, BookOpen, Target, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from 'framer-motion';

const Sparkline = ({ data, colorClass }) => {
    if (!data || data.length < 2) return null;

    // Filter out nulls
    const validData = data.filter(d => d.value !== null && d.value !== undefined);
    if (validData.length < 2) return null;

    const min = Math.min(...validData.map(d => d.value));
    const max = Math.max(...validData.map(d => d.value));

    // Normalize to 0-100 viewbox
    const padding = 10;
    const height = 100;
    const width = 300;

    const range = max - min || 1;

    const points = validData.map((d, i) => {
        const x = (i / (validData.length - 1)) * width;
        const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute bottom-0 left-0 w-full h-24 pointer-events-none" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${colorClass} opacity-20`}
                points={points}
            />
            <path
                d={`M 0,${height} L ${points} L ${width},${height} Z`}
                fill="currentColor"
                className={`${colorClass} opacity-[0.03]`}
            />
        </svg>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const MetricCard = ({ title, value, icon: Icon, subtitle, highlightClass = "text-indigo-600 bg-indigo-50", trendData, trendColorClass, loading }) => (
    <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl p-4 xl:p-5 shadow-sm border border-[#EBE9FC] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group h-full min-h-0"
    >
        <Sparkline data={trendData} colorClass={trendColorClass} />
        <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Icon size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4 z-10">
            <div className={`p-3 rounded-xl ${highlightClass}`}>
                <Icon size={20} />
            </div>
            <h3 className="font-bold text-gray-500 text-sm tracking-wide uppercase">{title}</h3>
        </div>
        <div className="z-10 mt-auto">
            {loading ? (
                <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg mb-2"></div>
            ) : (
                <div className="text-3xl font-black text-[#010104] tracking-tight">{value}</div>
            )}
            {loading ? (
                <div className="w-24 h-4 bg-gray-100 animate-pulse rounded-md mt-2"></div>
            ) : (
                subtitle && <p className="text-sm font-medium text-gray-400 mt-1">{subtitle}</p>
            )}
        </div>
    </motion.div>
);

export default function CountryHome() {
    const { countryId } = useParams();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('map');
    const [selectedRegions, setSelectedRegions] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [aggregates, setAggregates] = useState([]);

    const config = countryRegistry[countryId];

    useEffect(() => {
        if (!config) {
            navigate('/country/usa');
            return;
        }

        const saved = localStorage.getItem(`${countryId}AnalysisSelectedRegions`);
        if (saved) {
            try {
                setSelectedRegions(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }

        // Generate Aggregates from Mock Data
        setLoading(true);
        setTimeout(() => {
            const allRegionNames = config.regions.map(r => r.name);
            const mockData = config.mockDataFn ? config.mockDataFn(allRegionNames, false) : {}; // No forecast for home page stats
            
            const calculatedAggs = [];

            dimensions.forEach((dimName) => {
                const dimKey = config.dimensionsMap[dimName].key;
                
                // Group all values by year to create a trend line, and get latest average
                const yearMap = {};
                allRegionNames.forEach(region => {
                    const rData = mockData[region] || [];
                    rData.forEach(d => {
                        if (!d.is_forecast && d[dimKey] !== undefined) {
                            if (!yearMap[d.year]) {
                                yearMap[d.year] = { sum: 0, count: 0 };
                            }
                            yearMap[d.year].sum += d[dimKey];
                            yearMap[d.year].count++;
                        }
                    });
                });

                const trendData = Object.keys(yearMap).sort().map(year => ({
                    year: parseInt(year),
                    value: yearMap[year].sum / yearMap[year].count
                }));

                const latestValue = trendData.length > 0 ? trendData[trendData.length - 1].value : 0;
                
                calculatedAggs.push({
                    value: latestValue,
                    trendData: trendData
                });
            });

            setAggregates(calculatedAggs);
            setLoading(false);
        }, 500); // Simulate network delay

    }, [countryId, config, navigate]);

    if (!config) return null;

    const dimensions = Object.keys(config.dimensionsMap).slice(0, 6);
    const icons = [Activity, Wind, BookOpen, Target, TrendingUp, AlertCircle];
    const highlights = [
        { text: "text-emerald-600 bg-emerald-50", trend: "text-emerald-500" },
        { text: "text-blue-600 bg-blue-50", trend: "text-blue-500" },
        { text: "text-amber-600 bg-amber-50", trend: "text-amber-500" },
        { text: "text-purple-600 bg-purple-50", trend: "text-purple-500" },
        { text: "text-rose-600 bg-rose-50", trend: "text-rose-500" },
        { text: "text-cyan-600 bg-cyan-50", trend: "text-cyan-500" }
    ];

    const cardConfigs = dimensions.map((dimName, idx) => ({
        title: `Avg ${dimName}`,
        icon: icons[idx % icons.length],
        highlightClass: highlights[idx % highlights.length].text,
        trendColorClass: highlights[idx % highlights.length].trend
    }));

    const MapComponent = config.mapComponent;

    const handleRegionSelect = (regionObj) => {
        navigate(`/country/${countryId}/analysis`, { state: { initialRegion: regionObj } });
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return 'N/A';
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    return (
        <main className="bg-[#F9F8FF] h-screen w-screen overflow-hidden flex flex-col relative">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full pt-28 pb-2 xl:pt-32 xl:pb-4 px-6 flex flex-col items-center text-center flex-shrink-0 z-10"
            >
                <h1 className="text-3xl xl:text-5xl font-black text-[#010104] tracking-tighter mb-1 xl:mb-2">
                    {config.name} Profile
                </h1>
                <p className="text-sm xl:text-base text-gray-500 font-medium max-w-3xl">
                    Explore data indicators across {config.regions.length} regions.
                </p>
            </motion.div>

            {/* Bento Grid */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-[1600px] mx-auto flex-1 grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-3 xl:gap-5 px-4 xl:px-8 pb-4 xl:pb-6 min-h-0 z-10"
            >

                {/* Main Interactive Map (Takes up 2 columns and 2 rows on desktop) */}
                <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] shadow-sm border border-[#EBE9FC] p-4 flex flex-col h-full relative overflow-hidden">
                    <div className="flex justify-between items-center z-10 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-sm absolute top-8 left-8 right-8">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} className="text-indigo-600" />
                            <span className="font-bold text-[#010104]">Explorer</span>
                        </div>
                        <div className="flex bg-[#F9F8FF] rounded-full p-1 border border-[#EBE9FC]">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors ${viewMode === 'map' ? 'bg-[#010104] text-white' : 'text-gray-500 hover:text-[#010104]'}`}
                            >
                                2D Map
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors ${viewMode === 'list' ? 'bg-[#010104] text-white' : 'text-gray-500 hover:text-[#010104]'}`}
                            >
                                List View
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-full pt-20 flex justify-center items-center overflow-hidden">
                        {viewMode === 'map' && <MapComponent onStateSelect={handleRegionSelect} selectedStates={selectedRegions} />}
                        {viewMode === 'list' && (
                            <div className="w-full h-full overflow-hidden border border-[#EBE9FC] rounded-2xl">
                                <RegionList 
                                    onSelect={handleRegionSelect} 
                                    selectedRegions={selectedRegions} 
                                    regions={config.regions}
                                    getFlagUrl={config.getFlagUrl}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Render Metric Cards */}
                {cardConfigs[0] && (
                    <MetricCard
                        {...cardConfigs[0]}
                        value={aggregates[0] ? formatValue(aggregates[0].value) : '...'}
                        trendData={aggregates[0]?.trendData}
                        loading={loading}
                    />
                )}

                {cardConfigs[1] && (
                    <MetricCard
                        {...cardConfigs[1]}
                        value={aggregates[1] ? formatValue(aggregates[1].value) : '...'}
                        trendData={aggregates[1]?.trendData}
                        loading={loading}
                    />
                )}

                {/* Right Column Middle - Quick Start / Action Card */}
                <motion.div variants={itemVariants} className="md:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white rounded-[2rem] p-5 xl:p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group h-full">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="z-10">
                        <h3 className="font-bold text-indigo-200 text-xs xl:text-sm tracking-wide uppercase mb-1 xl:mb-2">Quick Start Analysis</h3>
                        <p className="text-lg xl:text-2xl font-black tracking-tight leading-tight mb-2 xl:mb-4 text-white">
                            Start analyzing <span className="text-blue-200">{config.name}'s regions</span> instantly across key indicators.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(`/country/${countryId}/analysis`)}
                        className="z-10 self-start bg-white text-indigo-700 px-4 py-2 xl:px-6 xl:py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm text-sm xl:text-base"
                    >
                        Go to Workspace <ArrowRight size={18} />
                    </button>
                </motion.div>

                {/* Render More Metric Cards */}
                {cardConfigs[2] && (
                    <MetricCard
                        {...cardConfigs[2]}
                        value={aggregates[2] ? formatValue(aggregates[2].value) : '...'}
                        trendData={aggregates[2]?.trendData}
                        loading={loading}
                    />
                )}

                {cardConfigs[3] && (
                    <MetricCard
                        {...cardConfigs[3]}
                        value={aggregates[3] ? formatValue(aggregates[3].value) : '...'}
                        trendData={aggregates[3]?.trendData}
                        loading={loading}
                    />
                )}

                {cardConfigs[4] && (
                    <MetricCard
                        {...cardConfigs[4]}
                        value={aggregates[4] ? formatValue(aggregates[4].value) : '...'}
                        trendData={aggregates[4]?.trendData}
                        loading={loading}
                    />
                )}

                {cardConfigs[5] && (
                    <MetricCard
                        {...cardConfigs[5]}
                        value={aggregates[5] ? formatValue(aggregates[5].value) : '...'}
                        trendData={aggregates[5]?.trendData}
                        loading={loading}
                    />
                )}

            </motion.section>
        </main>
    );
}
