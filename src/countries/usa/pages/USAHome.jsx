import React, { useState, useEffect } from "react";
import USMap from "../components/USMap";
import StatesList from "../components/StatesList";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function USAHome() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('map');
    const [selectedStates, setSelectedStates] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('usAnalysisSelectedStates');
        if (saved) {
            try {
                setSelectedStates(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const handleStateSelect = (stateObj) => {
        // Navigate to country analysis for this state
        navigate('/country/usa/analysis', { state: { initialState: stateObj } });
    };

    return (
        <main className="bg-[#F9F8FF] min-h-screen">
            {/* Header/Hero for US */}
            <section className="relative h-[40vh] w-full flex flex-col justify-center items-center text-center px-6 pt-20 overflow-hidden bg-[#010104]">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                        United States Profile
                    </h1>
                    <p className="max-w-xl text-gray-300 mb-6 mx-auto">
                        Explore data indicators across all 50 states.
                    </p>
                </div>
            </section>

            <section className="w-full flex flex-col items-center py-8 bg-white">
                <div className="flex bg-white rounded-full shadow-sm border border-[#EBE9FC] p-1 mb-8">
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

                <div className="w-[90vw] max-w-[1600px] mx-auto h-[600px] flex justify-center items-center">
                    {viewMode === 'map' && <USMap onStateSelect={handleStateSelect} selectedStates={selectedStates} />}
                    {viewMode === 'list' && (
                        <div className="w-full h-full border border-[#EBE9FC] rounded-2xl overflow-hidden shadow-sm">
                            <StatesList onSelect={handleStateSelect} selectedStates={selectedStates} />
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
