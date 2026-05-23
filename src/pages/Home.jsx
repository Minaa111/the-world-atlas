import Hero from "../Hero";
import Map from "../Map";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    const handleCountrySelect = (countryObj) => {
        navigate('/analysis', { state: { initialCountry: countryObj } });
    };

    return (
        <main>
            <Hero />
            <Map onCountrySelect={handleCountrySelect} />
        </main>
    );
}
