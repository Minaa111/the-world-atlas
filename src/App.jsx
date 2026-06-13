import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";
import Home from "./global/pages/Home";
import AnalysisWorkspace from "./global/pages/AnalysisWorkspace";
import About from "./global/pages/About";
import Choropleth from "./global/pages/Choropleth";
import DataDirectory from "./global/pages/DataDirectory";

// USA Profile
import USAHome from "./countries/usa/pages/USAHome";
import USAAnalysisWorkspace from "./countries/usa/pages/USAAnalysisWorkspace";
import USAChoropleth from "./countries/usa/pages/USAChoropleth";
import USADataDirectory from "./countries/usa/pages/USADataDirectory";

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
          <Route path="/country/usa" element={<USAHome />} />
          <Route path="/country/usa/analysis" element={<USAAnalysisWorkspace />} />
          <Route path="/country/usa/choropleth" element={<USAChoropleth />} />
          <Route path="/country/usa/directory" element={<USADataDirectory />} />
        </Routes>
      </div>
      {(!isAnalysisPage && !isChoroplethPage) && <Footer />}
    </div>
  );
}

export default App;