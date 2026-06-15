import React, { useState, useEffect } from "react";
import Map from "../components/Map";
import Globe from "../components/Globe";
import CountriesList from "../components/CountriesList";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Globe as GlobeIcon, Activity, Wind, BookOpen, Target, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from 'framer-motion';

import lookup from 'country-code-lookup';

const Sparkline = ({ data, colorClass }) => {
    if (!data || data.length < 2) return null;

    // Filter out nulls
    const validData = data.filter(d => d.value !== null);
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

const MetricCard = ({ title, value, icon: Icon, subtitle, highlightClass = "text-indigo-600 bg-indigo-50", iso3, fillColor, strokeColor, trendData, trendColorClass, setHoveredCard, loading }) => (
    <motion.div
        variants={itemVariants}
        className="bg-white rounded-3xl p-4 xl:p-5 shadow-sm border border-[#EBE9FC] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group h-full min-h-0"
        onMouseEnter={() => iso3 && setHoveredCard({ iso3, fillColor, strokeColor, name: subtitle, value: `${title}: ${value}` })}
        onMouseLeave={() => setHoveredCard(null)}
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

export default function Home() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('globe');
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [aggregates, setAggregates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('analysisSelectedCountries');
        if (saved) {
            try {
                setSelectedCountries(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }

        const fetchAggregates = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/api/data/aggregates');
                setAggregates(response.data);
            } catch (error) {
                console.error("Failed to fetch global aggregates", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAggregates();
    }, []);

    const handleCountrySelect = (countryObj) => {
        navigate('/global/analysis', { state: { initialCountry: countryObj } });
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return 'N/A';
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    const getCountryName = (iso3) => {
        if (!iso3) return '...';
        const result = lookup.byIso(iso3);
        return result ? result.country : iso3;
    };

    return (
        <main className="bg-[#F9F8FF] h-screen w-screen overflow-hidden flex flex-col relative">
            {/* Header Section */}
            <div className="w-full pt-28 pb-2 xl:pt-32 xl:pb-4 px-6 flex flex-col items-center text-center flex-shrink-0 z-10">
                <h1 className="text-3xl xl:text-5xl font-black text-[#010104] tracking-tighter mb-1 xl:mb-2">
                    The World Atlas.
                </h1>
                <p className="text-sm xl:text-base text-gray-500 font-medium max-w-3xl">
                    Explore comprehensive socio-economic data across {loading ? '...' : aggregates?.total_countries || 'all'} nations through our interactive 3D platform.
                </p>
            </div>

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
                            <GlobeIcon size={20} className="text-indigo-600" />
                            <span className="font-bold text-[#010104]">Explorer</span>
                        </div>
                        <div className="flex bg-[#F9F8FF] rounded-full p-1 border border-[#EBE9FC]">
                            <button
                                onClick={() => setViewMode('globe')}
                                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors ${viewMode === 'globe' ? 'bg-[#010104] text-white' : 'text-gray-500 hover:text-[#010104]'}`}
                            >
                                3D Globe
                            </button>
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

                    <div className="w-full h-full pt-16 flex justify-center items-center">
                        {viewMode === 'globe' && <Globe onCountrySelect={handleCountrySelect} selectedCountries={selectedCountries} hoveredCountry={hoveredCard} />}
                        {viewMode === 'map' && <Map onCountrySelect={handleCountrySelect} selectedCountries={selectedCountries} hoveredCountry={hoveredCard} />}
                        {viewMode === 'list' && (
                            <div className="w-full h-full overflow-hidden mt-4">
                                <CountriesList onSelect={handleCountrySelect} selectedCountries={selectedCountries} />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right Column Top - Stats */}
                <MetricCard
                    title="Avg Life Expectancy"
                    value={aggregates ? `${formatValue(aggregates.avg_life_expectancy)} yrs` : '...'}
                    icon={Activity}
                    highlightClass="text-emerald-600 bg-emerald-50"
                    trendData={aggregates?.trends?.life_expectancy}
                    trendColorClass="text-emerald-500"
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />

                <MetricCard
                    title="Avg PM2.5 Pollution"
                    value={aggregates ? `${formatValue(aggregates.avg_pm25)} µg/m³` : '...'}
                    icon={Wind}
                    highlightClass="text-blue-600 bg-blue-50"
                    trendData={aggregates?.trends?.pm25}
                    trendColorClass="text-blue-500"
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />

                {/* Right Column Middle - Quick Start / Action Card */}
                <motion.div variants={itemVariants} className="md:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white rounded-[2rem] p-5 xl:p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group h-full">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="z-10">
                        <h3 className="font-bold text-indigo-200 text-xs xl:text-sm tracking-wide uppercase mb-1 xl:mb-2">Quick Start Analysis</h3>
                        <p className="text-lg xl:text-2xl font-black tracking-tight leading-tight mb-2 xl:mb-4 text-white">
                            Start comparing countries instantly across <span className="text-blue-200">7 key indicators</span>.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/global/analysis')}
                        className="z-10 self-start bg-white text-indigo-700 px-4 py-2 xl:px-6 xl:py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm text-sm xl:text-base"
                    >
                        Go to Workspace <ArrowRight size={18} />
                    </button>
                </motion.div>

                {/* Right Column Bottom - More Stats */}
                <MetricCard
                    title="Avg Literacy Rate"
                    value={aggregates ? `${formatValue(aggregates.avg_literacy_rate)}%` : '...'}
                    icon={BookOpen}
                    highlightClass="text-amber-600 bg-amber-50"
                    trendData={aggregates?.trends?.literacy_rate}
                    trendColorClass="text-amber-500"
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />

                <MetricCard 
                    title="Highest GNI"
                    value={aggregates ? `$${formatValue(aggregates.max_gni?.value)}` : '...'}
                    subtitle={aggregates ? `${getCountryName(aggregates.max_gni?.country)} (${aggregates.max_gni?.year || 'Unknown'})` : '...'}
                    icon={TrendingUp}
                    highlightClass="text-pink-600 bg-pink-50"
                    iso3={aggregates?.max_gni?.country}
                    fillColor="#fbcfe8" // pink-200
                    strokeColor="#db2777" // pink-600
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />

                <MetricCard 
                    title="Lowest Inequality (Gini)"
                    value={aggregates ? formatValue(aggregates.min_gini?.value) : '...'}
                    subtitle={aggregates ? `${getCountryName(aggregates.min_gini?.country)} (${aggregates.min_gini?.year || 'Unknown'})` : '...'}
                    icon={Target}
                    highlightClass="text-purple-600 bg-purple-50"
                    iso3={aggregates?.min_gini?.country}
                    fillColor="#e9d5ff" // purple-200
                    strokeColor="#9333ea" // purple-600
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />

                <MetricCard
                    title="Avg Homicide Rate"
                    value={aggregates ? formatValue(aggregates.avg_homicide_rate) : '...'}
                    subtitle="per 100,000 people"
                    icon={AlertCircle}
                    highlightClass="text-red-600 bg-red-50"
                    trendData={aggregates?.trends?.homicide_rate}
                    trendColorClass="text-red-500"
                    setHoveredCard={setHoveredCard}
                    loading={loading}
                />
            </motion.section>
        </main>
    );
}
