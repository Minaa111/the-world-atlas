import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download } from "lucide-react";
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Radar, Scatter } from 'react-chartjs-2';
import Map from "../Map";
import CountriesList from "../components/CountriesList";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const dimensionsMap = {
    "Income Inequality": { key: "gini", label: "Gini Index (Income Inequality)", color: "#10b981" },
    "Life Expectancy": { key: "life_expectancy", label: "Life Expectancy at Birth (Years)", color: "#3b82f6" },
    "Crime": { key: "homicide_rate", label: "Intentional Homicide Rate (per 100k)", color: "#ef4444" },
    "Literacy Rate": { key: "literacy_rate", label: "Adult Literacy Rate (%)", color: "#f59e0b" },
    "Air Pollution": { key: "pm25", label: "PM2.5 Air Pollution", color: "#8b5cf6" },
    "GNI": { key: "gni", label: "Gross National Income (Atlas method, current US$)", color: "#ec4899" },
    "GNI per capita": { key: "gni_per_capita", label: "GNI per capita (Atlas method, current US$)", color: "#14b8a6" }
};

const formatValue = (val) => {
    if (val === null || val === undefined) return val;
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Analysis() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [activeDimensions, setActiveDimensions] = useState(["GNI"]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("map"); 
    const [viewTab, setViewTab] = useState("time"); // 'time', 'radar', or 'scatter'
    const [scatterX, setScatterX] = useState("GNI per capita");
    const [scatterY, setScatterY] = useState("GNI");
    const [showForecast, setShowForecast] = useState(false); // Predict 5 years
    const [isExporting, setIsExporting] = useState(false);

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const dimensions = ["GNI", "GNI per capita", "Income Inequality", "Life Expectancy", "Literacy Rate", "Crime", "Air Pollution"];
    const countryColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    useEffect(() => {
        if (location.state?.initialCountry) {
            const country = location.state.initialCountry;
            setSelectedCountries([country]);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        const fetchChartData = async () => {
            if (selectedCountries.length === 0) {
                setChartData({});
                return;
            }
            setIsLoading(true);
            const iso3Codes = selectedCountries.map(c => c.iso3).join(',');
            try {
                const response = await axios.get(`/api/data/compare?countries=${iso3Codes}&forecast=${showForecast}`);
                setChartData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChartData();
    }, [selectedCountries, showForecast]);

    const removeCountry = (name) => {
        setSelectedCountries(selectedCountries.filter(c => c.name !== name));
    };

    const toggleDimension = (dim) => {
        let newActive;
        if (activeDimensions.includes(dim)) {
            newActive = activeDimensions.filter(d => d !== dim);
        } else {
            newActive = [...activeDimensions, dim];
        }
        newActive.sort((a, b) => dimensions.indexOf(a) - dimensions.indexOf(b));
        setActiveDimensions(newActive);
    };

    const handleAddCountry = (countryObj) => {
        const exists = selectedCountries.find(c => c.name === countryObj.name);
        if (!exists) {
            setSelectedCountries([...selectedCountries, countryObj]);
        }
        setIsAddModalOpen(false);
    };

    const getLatestValues = (countryIso3) => {
        const cData = chartData[countryIso3] || [];
        const sorted = [...cData].filter(d => !d.is_forecast).sort((a, b) => b.year - a.year);
        
        const latest = {};
        dimensions.forEach(dim => {
            const key = dimensionsMap[dim].key;
            const record = sorted.find(d => d[key] !== null && d[key] !== undefined);
            latest[key] = record ? record[key] : null;
        });
        return latest;
    };

    const handleDownloadCSV = () => {
        if (selectedCountries.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        const cols = ["Country", "ISO3", "Year", "Is_Forecast"];
        dimensions.forEach(dim => cols.push(dim));
        csvContent += cols.join(",") + "\n";

        selectedCountries.forEach(country => {
            const cData = chartData[country.iso3] || [];
            cData.forEach(row => {
                if (!showForecast && row.is_forecast) return;

                const rowData = [
                    `"${country.name}"`, 
                    country.iso3, 
                    row.year, 
                    row.is_forecast ? "Yes" : "No"
                ];
                
                dimensions.forEach(dim => {
                    const key = dimensionsMap[dim].key;
                    rowData.push(row[key] !== null && row[key] !== undefined ? row[key] : "");
                });
                
                csvContent += rowData.join(",") + "\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inequality_atlas_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = async () => {
        if (selectedCountries.length === 0) return;
        
        setIsExporting(true);
        try {
            const element = document.getElementById("analysis-workspace-content");
            if (!element) return;
            
            // Temporary workaround: Convert ChartJS canvases to images before rendering
            const canvases = element.querySelectorAll('canvas');
            const replacedImages = [];
            
            canvases.forEach(canvas => {
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.style.width = canvas.style.width;
                img.style.height = canvas.style.height;
                img.style.boxSizing = 'border-box';
                
                // Hide canvas and insert img
                canvas.style.display = 'none';
                canvas.parentNode.insertBefore(img, canvas);
                
                replacedImages.push({ canvas, img });
            });

            // Small delay to ensure images are inserted in the DOM
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const renderCanvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#F9F8FF" });
            const imgData = renderCanvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: renderCanvas.width > renderCanvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [renderCanvas.width, renderCanvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, renderCanvas.width, renderCanvas.height);
            pdf.save(`Inequality_Atlas_${viewTab}_Report.pdf`);

            // Revert back to canvases
            replacedImages.forEach(({ canvas, img }) => {
                canvas.style.display = '';
                img.parentNode.removeChild(img);
            });
            
        } catch (error) {
            console.error("Error generating PDF", error);
            alert(`Error generating PDF: ${error.message || error}\n\nPlease share this error message!`);
        } finally {
            setIsExporting(false);
        }
    };

    const renderTimeCharts = () => {
        return (
            <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
                {activeDimensions.map(dimName => {
                    const dimInfo = dimensionsMap[dimName];
                    const metric = dimInfo.key;

                    const allYears = new Set();
                    selectedCountries.forEach(country => {
                        const cData = chartData[country.iso3] || [];
                        cData.forEach(d => {
                            if (d[metric] !== null && d[metric] !== undefined) {
                                allYears.add(d.year);
                            }
                        });
                    });

                    const sortedYears = Array.from(allYears).sort((a, b) => a - b);
                    
                    if (sortedYears.length === 0) {
                        return (
                            <div key={dimName} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col" style={{ height: '400px' }}>
                                <h3 className="text-xl font-bold mb-4 text-[#010104]">{dimInfo.label}</h3>
                                <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3V21H21" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 14L11 10L15 14L21 8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <p className="text-gray-400 font-medium">No data available for the selected countries.</p>
                                </div>
                            </div>
                        );
                    }

                    const datasets = selectedCountries.flatMap((country, idx) => {
                        const cData = chartData[country.iso3] || [];
                        const color = countryColors[idx % countryColors.length];

                        // Historical Data
                        const histRecords = cData.filter(d => !d.is_forecast && d[metric] !== null && d[metric] !== undefined);
                        const lastHist = histRecords.length > 0 ? histRecords[histRecords.length - 1] : null;

                        const histPoints = sortedYears.map(y => {
                            const rec = cData.find(d => d.year === y && !d.is_forecast);
                            return rec && rec[metric] !== null ? rec[metric] : null;
                        });

                        const hasData = histPoints.some(val => val !== null);
                        
                        const datasetList = [{
                            label: country.name + (hasData ? "" : " (No Data)"),
                            data: histPoints,
                            borderColor: color,
                            backgroundColor: color,
                            tension: 0.3,
                            pointRadius: 3,
                            spanGaps: true
                        }];

                        // Forecast Data
                        if (showForecast) {
                            const forecastPoints = sortedYears.map(y => {
                                if (lastHist && y === lastHist.year) {
                                    return lastHist[metric]; // Connect point
                                }
                                const rec = cData.find(d => d.year === y && d.is_forecast);
                                return rec && rec[metric] !== null ? rec[metric] : null;
                            });

                            const hasForecast = forecastPoints.some(val => val !== null) && forecastPoints.filter(val => val !== null).length > 1;

                            if (hasForecast) {
                                datasetList.push({
                                    label: `${country.name} (Forecast)`,
                                    data: forecastPoints,
                                    borderColor: color,
                                    backgroundColor: color,
                                    tension: 0.3,
                                    pointRadius: 0, // hide points on forecast line for cleaner look
                                    borderDash: [5, 5], // Dashed line
                                    spanGaps: true
                                });
                            }
                        }

                        return datasetList;
                    });

                    const data = {
                        labels: sortedYears,
                        datasets: datasets
                    };

                    const options = {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: { 
                                position: 'top',
                                labels: {
                                    filter: function(item, chart) {
                                        // Hide forecast labels from legend to keep it clean
                                        return !item.text.includes('(Forecast)');
                                    }
                                },
                                onClick: function(e, legendItem, legend) {
                                    const index = legendItem.datasetIndex;
                                    const chart = legend.chart;
                                    
                                    // Toggle the main dataset
                                    const meta = chart.getDatasetMeta(index);
                                    const isHidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                                    meta.hidden = isHidden;
                                    
                                    // Find and toggle the corresponding forecast dataset
                                    const mainLabel = chart.data.datasets[index].label.replace(' (No Data)', '');
                                    const forecastLabel = `${mainLabel} (Forecast)`;
                                    
                                    chart.data.datasets.forEach((dataset, i) => {
                                        if (dataset.label === forecastLabel) {
                                            const forecastMeta = chart.getDatasetMeta(i);
                                            forecastMeta.hidden = isHidden;
                                        }
                                    });
                                    
                                    chart.update();
                                }
                            },
                            title: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += formatValue(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: metric === 'homicide_rate' || metric === 'pm25'
                            }
                        }
                    };

                    return (
                        <div key={dimName} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col" style={{ height: '400px' }}>
                            <h3 className="text-xl font-bold mb-4 text-[#010104]">{dimInfo.label}</h3>
                            <div className="flex-1 relative w-full h-full">
                                <Line data={data} options={options} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRadarCharts = () => {
        // Use global predefined maximums for consistent radar shapes
        const globalMaxValues = {
            "gini": 100,
            "life_expectancy": 90,
            "homicide_rate": 100,
            "literacy_rate": 100,
            "pm25": 100,
            "gni": 30000000000000, // 30 Trillion
            "gni_per_capita": 150000
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 z-10 relative bg-[#F9F8FF] w-full">
                {selectedCountries.map((country, idx) => {
                    const latest = getLatestValues(country.iso3);
                    const color = countryColors[idx % countryColors.length];
                    
                    const dataPoints = dimensions.map(dim => {
                        const raw = latest[dimensionsMap[dim].key] || 0;
                        return (raw / globalMaxValues[dimensionsMap[dim].key]) * 100;
                    });
                    
                    const data = {
                        labels: dimensions,
                        datasets: [
                            {
                                label: country.name,
                                data: dataPoints,
                                backgroundColor: color + '40',
                                borderColor: color,
                                pointBackgroundColor: color,
                                pointBorderColor: '#fff',
                                borderWidth: 2,
                            }
                        ]
                    };

                    const options = {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 20 },
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(0,0,0,0.1)' },
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                pointLabels: { 
                                    padding: 24,
                                    font: { size: 12, weight: 'bold' }, 
                                    color: '#010104',
                                    callback: function(value, index) {
                                        const dimName = dimensions[index];
                                        const max = globalMaxValues[dimensionsMap[dimName].key];
                                        let maxStr = formatValue(max);
                                        if (maxStr.endsWith('.00')) maxStr = maxStr.slice(0, -3);
                                        return [value, `(Max: ${maxStr})`];
                                    }
                                },
                                ticks: { display: false, maxTicksLimit: 5 }
                            }
                        },
                        interaction: {
                            mode: 'dataset',
                            intersect: false,
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const dimName = dimensions[context.dataIndex];
                                        const rawVal = latest[dimensionsMap[dimName].key];
                                        return rawVal !== null ? `${dimName}: ${formatValue(rawVal)}` : `${dimName}: No Data`;
                                    }
                                }
                            }
                        }
                    };

                    const centerPointLabelsPlugin = {
                        id: 'centerPointLabels',
                        afterLayout: (chart) => {
                            if (chart.scales.r && chart.scales.r._pointLabelItems) {
                                chart.scales.r._pointLabelItems.forEach(item => {
                                    item.textAlign = 'center';
                                });
                            }
                        }
                    };

                    return (
                        <div key={country.iso3} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col items-center" style={{ height: '600px' }}>
                            <div className="flex items-center gap-3 mb-6 w-full pb-4 border-b border-[#EBE9FC]">
                                {country.code && (
                                    <img 
                                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} 
                                        alt="flag"
                                        className="w-8 h-auto rounded shadow-sm border border-gray-100"
                                    />
                                )}
                                <h3 className="text-xl font-bold text-[#010104]">{country.name}</h3>
                            </div>
                            <div className="flex-1 relative w-full h-full px-4">
                                <Radar data={data} options={options} plugins={[centerPointLabelsPlugin]} />
                            </div>
                            <div className="w-full text-center mt-4 text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg flex flex-col gap-1">
                                <span>* Using latest available historical data point per dimension</span>
                                <span>* Values are normalized relative to global theoretical maximums</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderScatterChart = () => {
        const xDim = dimensionsMap[scatterX];
        const yDim = dimensionsMap[scatterY];

        const datasets = selectedCountries.map((country, idx) => {
            const cData = chartData[country.iso3] || [];
            const color = countryColors[idx % countryColors.length];
            
            const points = [];
            cData.forEach(d => {
                if (!d.is_forecast && d[xDim.key] !== null && d[xDim.key] !== undefined && d[yDim.key] !== null && d[yDim.key] !== undefined) {
                    points.push({
                        x: d[xDim.key],
                        y: d[yDim.key],
                        year: d.year
                    });
                }
            });

            return {
                label: country.name,
                data: points,
                backgroundColor: color,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        const data = { datasets };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: xDim.label, font: { weight: 'bold', size: 14 } }
                },
                y: {
                    title: { display: true, text: yDim.label, font: { weight: 'bold', size: 14 } }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pt = context.raw;
                            return `${context.dataset.label} (${pt.year}): ${scatterX}=${formatValue(pt.x)}, ${scatterY}=${formatValue(pt.y)}`;
                        }
                    }
                }
            }
        };

        return (
            <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col" style={{ height: '550px' }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h3 className="text-xl font-bold text-[#010104]">Correlation Analysis</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-500">Y-Axis:</label>
                                <select 
                                    value={scatterY} 
                                    onChange={e => setScatterY(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold bg-gray-50 focus:outline-none focus:border-indigo-500"
                                >
                                    {dimensions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-500">X-Axis:</label>
                                <select 
                                    value={scatterX} 
                                    onChange={e => setScatterX(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold bg-gray-50 focus:outline-none focus:border-indigo-500"
                                >
                                    {dimensions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative w-full h-full px-4 pb-4">
                        <Scatter data={data} options={options} />
                    </div>
                </div>
            </div>
        );
    };

    const renderWorkspace = () => {
        if (selectedCountries.length === 0) {
            return (
                <div className="text-center z-10 flex flex-col items-center gap-4 py-32 bg-white w-full rounded-3xl shadow-sm border border-[#EBE9FC]">
                    <div className="flex items-end justify-center h-32 gap-3 opacity-30">
                        <div className="w-10 bg-[#010104] h-12 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-24 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-16 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-28 rounded-t-sm"></div>
                        <div className="w-10 bg-[#010104] h-20 rounded-t-sm"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#010104] tracking-wide">Analysis Workspace</h3>
                    <p className="text-gray-500 font-medium">Select dimensions and countries to visualize insights.</p>
                </div>
            );
        }

        if (isLoading) {
            return <div className="p-20 text-center font-bold text-gray-500 animate-pulse w-full">Loading data...</div>;
        }

        return (
            <div className="w-full flex flex-col gap-6">
                {/* View Tabs & Actions */}
                <div className="flex justify-between items-center px-8 pt-4">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setViewTab("time")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "time" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <LineChart size={18} /> Time Series
                        </button>
                        <button 
                            onClick={() => setViewTab("radar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "radar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <Hexagon size={18} /> Radar View
                        </button>
                        <button 
                            onClick={() => setViewTab("scatter")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "scatter" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="2"/><circle cx="12" cy="11" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="16" cy="18" r="2"/><circle cx="7" cy="8" r="2"/></svg> Correlation
                        </button>
                    </div>

                    {/* AI Forecast & Download */}
                    <div className="flex gap-4">
                        <button 
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm border bg-white text-gray-500 border-[#EBE9FC] hover:border-gray-300 hover:text-[#010104]"
                        >
                            <Download size={18} /> Download CSV
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm border ${isExporting ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-500 border-[#EBE9FC] hover:border-gray-300 hover:text-[#010104]"}`}
                        >
                            <Download size={18} /> {isExporting ? "Generating PDF..." : "Export as PDF"}
                        </button>

                        {viewTab === "time" && (
                            <button 
                                onClick={() => setShowForecast(!showForecast)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm border ${showForecast ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : "bg-white text-gray-500 border-[#EBE9FC] hover:border-indigo-200 hover:text-indigo-600"}`}
                            >
                                <Sparkles size={18} className={showForecast ? "text-indigo-600" : "text-gray-400"} />
                                {showForecast ? "5-Year Forecast Active" : "Enable AI Forecast"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Render Selected View */}
                <div id="analysis-workspace-content" className="w-full bg-[#F9F8FF] rounded-3xl pb-4">
                    {viewTab === "time" && renderTimeCharts()}
                    {viewTab === "radar" && renderRadarCharts()}
                    {viewTab === "scatter" && renderScatterChart()}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-12 px-6 flex flex-col items-center bg-[#F9F8FF]">
            <div className="w-full max-w-7xl flex flex-col gap-8">
                
                {/* Header Section (Light Mode) */}
                <div className="flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-sm border border-[#EBE9FC]">
                    <div className="flex justify-between items-center w-full">
                        <h1 className="text-4xl font-bold text-[#010104] tracking-tight">Analysis</h1>
                        <button 
                            onClick={() => navigate('/')}
                            className="text-[#010104] hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Countries Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedCountries.map(country => (
                            <div key={country.name} className="flex items-center gap-2 bg-[#010104] text-[#EBE9FC] px-4 py-2 rounded-full font-bold text-sm shadow-md group transition-all">
                                {country.code && (
                                    <img 
                                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} 
                                        alt="flag"
                                        className="w-5 h-auto rounded-[2px]"
                                    />
                                )}
                                <span>{country.name}</span>
                                <button 
                                    onClick={() => removeCountry(country.name)}
                                    className="ml-1 opacity-60 hover:opacity-100 hover:text-white transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#EBE9FC] text-[#010104] hover:bg-[#dcd9fa] px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span>Add Country</span>
                        </button>
                    </div>

                    {/* Dimensions Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#EBE9FC]">
                        {dimensions.map(dim => {
                            const isActive = activeDimensions.includes(dim);
                            return (
                                <button
                                    key={dim}
                                    onClick={() => toggleDimension(dim)}
                                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-[#010104] text-[#EBE9FC] shadow-md transform scale-105' 
                                            : 'bg-white text-[#010104] hover:bg-gray-50 border border-[#EBE9FC]'
                                    }`}
                                >
                                    {dim}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="w-full flex justify-center">
                    {renderWorkspace()}
                </div>

            </div>

            {/* Add Country Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010104]/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '85vw', height: '85vh', maxWidth: '1400px' }}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#EBE9FC] flex justify-between items-center bg-white">
                            <div className="flex gap-4 bg-[#EBE9FC]/30 p-1 rounded-xl">
                                <button 
                                    onClick={() => setModalTab("map")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "map" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <MapIcon size={18} /> Map
                                </button>
                                <button 
                                    onClick={() => setModalTab("list")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "list" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <List size={18} /> List
                                </button>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-gray-500 hover:text-[#010104] hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="flex-1 overflow-hidden relative bg-[#F9F8FF]">
                            {modalTab === "map" ? (
                                <div className="absolute inset-0">
                                    <Map 
                                        onCountrySelect={handleAddCountry} 
                                        selectedCountries={selectedCountries} 
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0">
                                    <CountriesList 
                                        onSelect={handleAddCountry} 
                                        selectedCountries={selectedCountries} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
