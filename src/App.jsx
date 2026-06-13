import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import About from "./pages/About";
import Choropleth from "./pages/Choropleth";
import DataDirectory from "./pages/DataDirectory";

function App() {
  const location = useLocation();
  const isAnalysisPage = location.pathname === '/analysis';
  const isChoroplethPage = location.pathname === '/choropleth';

  return (
    <div className="flex flex-col min-h-screen">
      {(!isAnalysisPage && !isChoroplethPage) && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/choropleth" element={<Choropleth />} />
          <Route path="/about" element={<About />} />
          <Route path="/directory" element={<DataDirectory />} />
        </Routes>
      </div>
      {(!isAnalysisPage && !isChoroplethPage) && <Footer />}
    </div>
  );
}

export default App;