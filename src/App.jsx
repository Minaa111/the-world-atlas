import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import About from "./pages/About";

function App() {
  const location = useLocation();
  const isAnalysisPage = location.pathname === '/analysis';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAnalysisPage && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      {!isAnalysisPage && <Footer />}
    </div>
  );
}

export default App;