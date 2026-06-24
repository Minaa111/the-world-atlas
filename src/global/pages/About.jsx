import React from 'react';
import { Link } from 'react-router-dom';
import { THEMATIC_PILLARS } from '../../shared/config/indicators';
import { countryRegistry } from '../../countries/config/countryRegistry';
import { DollarSign, Heart, Shield, Leaf, Globe, Map, AlertTriangle, Database } from 'lucide-react';

const ICON_MAP = {
    DollarSign,
    Heart,
    Shield,
    Leaf
};

export default function About() {
    const availableCountries = Object.values(countryRegistry);

    return (
        <div className="w-full flex flex-col bg-[#F9F8FF] min-h-screen">
            {/* Hero Section */}
            <div className="w-full bg-[#010104] pt-40 pb-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] rounded-full bg-indigo-600 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] rounded-full bg-violet-600 blur-[120px]"></div>
                </div>
                <div className="max-w-6xl mx-auto relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-[#EBE9FC] tracking-tight mb-6">
                        About The World Atlas
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-3xl mx-auto leading-relaxed">
                        A data-driven platform for exploring and visualizing key global socioeconomic development indicators across nations and regions.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col gap-24">

                {/* Thematic Pillars & Indicators Section */}
                <section>
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold text-[#010104] mb-4 flex items-center justify-center gap-3">
                            <Database className="text-indigo-600" />
                            Global Indicators Glossary
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            The Atlas integrates 17 distinct socioeconomic indicators grouped into four foundational pillars of global development. All global scope data is sourced from the World Bank API, World Health Organization (WHO), and UNODC.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {THEMATIC_PILLARS.map(pillar => {
                            const IconComponent = ICON_MAP[pillar.icon] || Globe;
                            return (
                                <div key={pillar.id} className="bg-white rounded-3xl p-8 border border-[#EBE9FC] shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl ${pillar.bg} mb-8`}>
                                        <IconComponent className={pillar.color} size={24} />
                                        <h3 className={`text-xl font-bold ${pillar.color}`}>{pillar.label}</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {pillar.indicators.map(ind => (
                                            <div key={ind.key} className="group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-base font-bold text-[#010104] group-hover:text-indigo-600 transition-colors">
                                                        {ind.label}
                                                    </h4>
                                                    {ind.unit && (
                                                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                                                            {ind.unit}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    {ind.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Local Regional Profiles */}
                <section className="bg-[#010104] rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-[#EBE9FC] shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-bold flex items-center gap-3 mb-4">
                                    <Map className="text-indigo-400" />
                                    Deep Dive Country Profiles
                                </h2>
                                <p className="text-gray-400 max-w-2xl leading-relaxed">
                                    Beyond the global scope, The Atlas features granular, regional breakdowns for specific nations. The local indicators for these countries are dynamically generated via forecasting mock data for analytical demonstration purposes.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {availableCountries.map(country => (
                                <Link 
                                    key={country.id} 
                                    to={`/country/${country.id}`}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors backdrop-blur-sm block"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={`https://flagcdn.com/w80/${country.iso2.toLowerCase()}.png`} alt={`${country.name} Flag`} className="w-12 h-8 rounded object-cover shadow-sm" />
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{country.name}</h3>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{country.regions.length} Regions</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {country.dimensions.slice(0, 3).map(dim => (
                                            <span key={dim} className="text-xs font-medium px-2 py-1 bg-white/10 text-gray-300 rounded-md">
                                                {dim}
                                            </span>
                                        ))}
                                        {country.dimensions.length > 3 && (
                                            <span className="text-xs font-medium px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md">
                                                +{country.dimensions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <section className="bg-orange-50 border border-orange-100 rounded-3xl p-8 md:p-10 mb-10">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="text-orange-500 flex-shrink-0 mt-1" size={28} />
                        <div>
                            <h2 className="text-xl font-bold text-[#010104] mb-3">Academic Project Disclaimer</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                The World Atlas is an academic graduate project and is not intended to serve as an official or institutional resource. While global historical data is sourced from reputable organizations, the platform employs structural AI forecasting and random-walk algorithms to simulate future trajectories and local regional data (for countries like the USA, Canada, and Australia).
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                                Therefore, individual state/province mock data and any future global projections (post-2023) should not be interpreted as accurate real-world statistics. Users are encouraged to interpret this information strictly as a technical demonstration of analytical visualization capabilities.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
