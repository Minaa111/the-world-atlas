import React, { useState, useEffect } from "react";
import Hero from "../Hero";
import Map from "../Map";
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
                <div className="flex bg-white rounded-full shadow-sm border border-[#EBE9FC] p-1 mb-8">
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

                <div className="w-full h-[600px] flex justify-center items-center px-6">
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
