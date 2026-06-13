import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Map from "../components/Map";
import Globe from "../components/Globe";
import CountriesList from "../components/CountriesList";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('globe');
    const [selectedCountries, setSelectedCountries] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('analysisSelectedCountries');
        if (saved) {
            try {
                setSelectedCountries(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const handleCountrySelect = (countryObj) => {
        navigate('/analysis', { state: { initialCountry: countryObj } });
    };

    return (
        <main className="bg-[#F9F8FF] min-h-screen">
            <Hero />

            <section className="w-full flex flex-col items-center py-8 bg-white">
                <div className="flex flex-col items-center mb-8 px-4">
                    <div className="flex bg-white rounded-full shadow-sm border border-[#EBE9FC] p-1 mb-3">
                        <button
                            onClick={() => setViewMode('globe')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${viewMode === 'globe' ? 'bg-[#010104] text-white' : 'text-[#3B3B3B] hover:bg-[#F9F8FF]'}`}
                        >
                            3D Globe
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${viewMode === 'map' ? 'bg-[#010104] text-white' : 'text-[#3B3B3B] hover:bg-[#F9F8FF]'}`}
                        >
                            2D Map
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors ${viewMode === 'list' ? 'bg-[#010104] text-white' : 'text-[#3B3B3B] hover:bg-[#F9F8FF]'}`}
                        >
                            List View
                        </button>
                    </div>
                    {viewMode !== 'list' && (
                        <p className="text-xs text-gray-500 max-w-lg text-center font-medium">
                            <span className="font-bold text-gray-600">Note:</span> Due to map resolution constraints, some smaller microstates might not be visible here. All countries remain fully accessible via the <button onClick={() => setViewMode('list')} className="text-[#3A31D8] font-bold hover:underline">List View</button>.
                        </p>
                    )}
                </div>

                <div className="w-[90vw] max-w-[1600px] mx-auto h-[600px] flex justify-center items-center">
                    {viewMode === 'globe' && <Globe onCountrySelect={handleCountrySelect} selectedCountries={selectedCountries} />}
                    {viewMode === 'map' && <Map onCountrySelect={handleCountrySelect} selectedCountries={selectedCountries} />}
                    {viewMode === 'list' && (
                        <div className="w-full h-full border border-[#EBE9FC] rounded-2xl overflow-hidden shadow-sm">
                            <CountriesList onSelect={handleCountrySelect} selectedCountries={selectedCountries} />
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
