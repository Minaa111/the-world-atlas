import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";
import Home from "./global/pages/Home";
import AnalysisWorkspace from "./global/pages/AnalysisWorkspace";
import About from "./global/pages/About";
import Choropleth from "./global/pages/Choropleth";
import DataDirectory from "./global/pages/DataDirectory";

// Country Profile
import CountryHome from "./countries/pages/CountryHome";
import CountryAnalysisWorkspace from "./countries/pages/CountryAnalysisWorkspace";
import CountryChoropleth from "./countries/pages/CountryChoropleth";
import CountryDataDirectory from "./countries/pages/CountryDataDirectory";

function App() {
  const location = useLocation();
  const isAnalysisPage = location.pathname.includes('/analysis');
  const isChoroplethPage = location.pathname.includes('/choropleth');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {(!isAnalysisPage && !isChoroplethPage) && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* Global Routes */}
          <Route path="/" element={<Navigate to="/global" replace />} />
          <Route path="/home" element={<Navigate to="/global" replace />} />
          <Route path="/global" element={<Home />} />
          <Route path="/global/analysis" element={<AnalysisWorkspace />} />
          <Route path="/global/choropleth" element={<Choropleth />} />
          <Route path="/global/about" element={<About />} />
          <Route path="/global/directory" element={<DataDirectory />} />
          <Route path="/about" element={<Navigate to="/global/about" replace />} /> {/* Legacy compatibility */}

          {/* Country Profile Routes */}
          <Route path="/country" element={<Navigate to="/country/usa" replace />} />
          <Route path="/country/:countryId" element={<CountryHome />} />
          <Route path="/country/:countryId/analysis" element={<CountryAnalysisWorkspace />} />
          <Route path="/country/:countryId/choropleth" element={<CountryChoropleth />} />
          <Route path="/country/:countryId/directory" element={<CountryDataDirectory />} />
        </Routes>
      </div>
      {(!isAnalysisPage && !isChoroplethPage) && <Footer />}
    </div>
  );
}

export default App;