import React from "react";
import { useNavigate } from "react-router-dom";
import CountriesList from "../components/CountriesList";

export default function Countries() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pb-12 px-6 flex flex-col items-center bg-[#F9F8FF]" style={{ paddingTop: '140px' }}>
            <div className="w-full max-w-7xl flex flex-col bg-white rounded-3xl shadow-sm border border-[#EBE9FC] overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
                <CountriesList onSelect={(country) => navigate('/analysis', { state: { initialCountry: country } })} />
            </div>
        </div>
    );
}
