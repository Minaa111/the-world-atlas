import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Plus, Map as MapIcon, List, LineChart, Hexagon, Sparkles, Download, Globe as GlobeIcon, BarChart2, PieChart, Table } from "lucide-react";
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Radar, Scatter, Bar, PolarArea } from 'react-chartjs-2';
import USMap from "../components/USMap";
import StatesList from "../components/StatesList";
import { usDimensionsMap, usDimensions, getMockUSData } from "../data/usMockData";
import { statesList } from "../data/states";

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const formatValue = (val) => {
    if (val === null || val === undefined) return val;
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function StateAnalysisWorkspace() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedStates, setSelectedStates] = useState(() => {
        let initial = [];
        const saved = localStorage.getItem('usAnalysisSelectedStates');
        if (saved) {
            try {
                initial = JSON.parse(saved);
            } catch (e) {
                // ignore
            }
        }
        if (location.state?.initialState) {
            const stateObj = location.state.initialState;
            const exists = initial.find(s => s.name === stateObj.name);
            if (!exists) {
                initial.push(stateObj);
            }
        }
        return initial;
    });
    const [activeDimension, setActiveDimension] = useState(() => {
        return localStorage.getItem('usAnalysisActiveDimension') || "Median Income";
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState("map");
    const [viewTab, setViewTab] = useState("time");
    const [scatterX, setScatterX] = useState(() => localStorage.getItem('usAnalysisScatterX') || "Median Income");
    const [scatterY, setScatterY] = useState(() => localStorage.getItem('usAnalysisScatterY') || "Poverty Rate");
    const [showForecast, setShowForecast] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const stateColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    useEffect(() => {
        localStorage.setItem('usAnalysisSelectedStates', JSON.stringify(selectedStates));
    }, [selectedStates]);

    useEffect(() => {
        localStorage.setItem('usAnalysisActiveDimension', activeDimension);
    }, [activeDimension]);

    useEffect(() => {
        localStorage.setItem('usAnalysisScatterX', scatterX);
    }, [scatterX]);

    useEffect(() => {
        localStorage.setItem('usAnalysisScatterY', scatterY);
    }, [scatterY]);

    useEffect(() => {
        if (location.state?.initialState) {
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (selectedStates.length === 0) {
            setChartData({});
            return;
        }
        setIsLoading(true);
        // Use Mock Data
        setTimeout(() => {
            const mockData = getMockUSData(selectedStates.map(s => s.name), showForecast);
            setChartData(mockData);
            setIsLoading(false);
        }, 300);
    }, [selectedStates, showForecast]);

    const removeState = (name) => {
        setSelectedStates(selectedStates.filter(s => s.name !== name));
    };

    const toggleDimension = (dim) => {
        setActiveDimension(dim);
    };

    const handleAddState = (stateObj) => {
        const exists = selectedStates.find(s => s.name === stateObj.name);
        if (!exists) {
            setSelectedStates([...selectedStates, stateObj]);
        }
        setIsAddModalOpen(false);
    };

    const getLatestValues = (stateName) => {
        const sData = chartData[stateName] || [];
        const sorted = [...sData].filter(d => !d.is_forecast).sort((a, b) => b.year - a.year);

        const latest = {};
        usDimensions.forEach(dim => {
            const key = usDimensionsMap[dim].key;
            const record = sorted.find(d => d[key] !== null && d[key] !== undefined);
            latest[key] = record ? record[key] : null;
        });
        return latest;
    };

    const handleDownloadCSV = () => {
        if (selectedStates.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        const cols = ["State", "ISO3", "Year", "Is_Forecast"];
        usDimensions.forEach(dim => cols.push(dim));
        csvContent += cols.join(",") + "\n";

        selectedStates.forEach(state => {
            const sData = chartData[state.name] || [];
            sData.forEach(row => {
                if (!showForecast && row.is_forecast) return;

                const rowData = [
                    `"${state.name}"`,
                    state.name,
                    row.year,
                    row.is_forecast ? "Yes" : "No"
                ];

                usDimensions.forEach(dim => {
                    const key = usDimensionsMap[dim].key;
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
        if (selectedStates.length === 0) return;

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
                {/* Dimensions Row (Moved to Time Series View) */}
                <div className="sticky top-[80px] z-30 bg-[#F9F8FF] flex flex-col items-start gap-3 py-4 -mt-8 -mx-8 px-8 border-b border-[#EBE9FC]">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Indicators</span>
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {usDimensions.map(dim => {
                            const isActive = activeDimension === dim;
                            return (
                                <button
                                    key={dim}
                                    onClick={() => toggleDimension(dim)}
                                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 border ${isActive
                                            ? 'bg-[#010104] text-[#EBE9FC] border-[#010104] shadow-md'
                                            : 'bg-white text-[#010104] hover:bg-gray-50 border-[#EBE9FC]'
                                        }`}
                                >
                                    {dim}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {[activeDimension].map(dimName => {
                    const dimInfo = usDimensionsMap[dimName];
                    const metric = dimInfo.key;

                    const allYears = new Set();
                    selectedStates.forEach(state => {
                        const sData = chartData[state.name] || [];
                        sData.forEach(d => {
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
                                        <path d="M3 3V21H21" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7 14L11 10L15 14L21 8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-gray-400 font-medium">No data available for the selected countries.</p>
                                </div>
                            </div>
                        );
                    }

                    const datasets = selectedStates.flatMap((state, idx) => {
                        const sData = chartData[state.name] || [];
                        const color = stateColors[idx % stateColors.length];

                        // Historical Data
                        const histRecords = sData.filter(d => !d.is_forecast && d[metric] !== null && d[metric] !== undefined);
                        const lastHist = histRecords.length > 0 ? histRecords[histRecords.length - 1] : null;

                        const histPoints = sortedYears.map(y => {
                            const rec = sData.find(d => d.year === y && !d.is_forecast);
                            return rec && rec[metric] !== null ? rec[metric] : null;
                        });

                        const hasData = histPoints.some(val => val !== null);

                        const datasetList = [{
                            label: state.name + (hasData ? "" : " (No Data)"),
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
                                const rec = sData.find(d => d.year === y && d.is_forecast);
                                return rec && rec[metric] !== null ? rec[metric] : null;
                            });

                            const hasForecast = forecastPoints.some(val => val !== null) && forecastPoints.filter(val => val !== null).length > 1;

                            if (hasForecast) {
                                datasetList.push({
                                    label: `${state.name} (Forecast)`,
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
                                    filter: function (item, chart) {
                                        // Hide forecast labels from legend to keep it clean
                                        return !item.text.includes('(Forecast)');
                                    }
                                },
                                onClick: function (e, legendItem, legend) {
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
                                    label: function (context) {
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

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 z-10 relative bg-[#F9F8FF] w-full">
                {selectedStates.map((state, idx) => {
                    const latest = getLatestValues(state.name);
                    const color = stateColors[idx % stateColors.length];

                    const dataPoints = usDimensions.map(dim => {
                        const raw = latest[usDimensionsMap[dim].key];
                        if (raw === undefined || raw === null) return null;
                        return (raw / usDimensionsMap[dim].max) * 100;
                    });

                    const data = {
                        labels: usDimensions,
                        datasets: [
                            {
                                label: state.name,
                                data: dataPoints,
                                backgroundColor: color + '40',
                                borderColor: color,
                                pointBackgroundColor: color,
                                pointBorderColor: '#fff',
                                borderWidth: 2,
                                spanGaps: true,
                            }
                        ]
                    };

                    const options = {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 20 },
                        scales: {
                            r: {
                                min: 0,
                                max: 100,
                                angleLines: { color: 'rgba(0,0,0,0.1)' },
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                pointLabels: {
                                    padding: 24,
                                    font: { size: 12, weight: 'bold' },
                                    color: function(context) {
                                        const dimName = usDimensions[context.index];
                                        const raw = latest[usDimensionsMap[dimName].key];
                                        return (raw === undefined || raw === null) ? '#9ca3af' : '#010104';
                                    },
                                    callback: function (value, index) {
                                        const dimName = usDimensions[index];
                                        const max = usDimensionsMap[dimName].max;
                                        let maxStr = formatValue(max);
                                        if (maxStr.endsWith('.00')) maxStr = maxStr.slice(0, -3);
                                        return [value, `(Max: ${maxStr})`];
                                    }
                                },
                                ticks: { display: false, stepSize: 20 }
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
                                    label: function (context) {
                                        const dimName = usDimensions[context.dataIndex];
                                        const rawVal = latest[usDimensionsMap[dimName].key];
                                        return (rawVal !== null && rawVal !== undefined) ? `${dimName}: ${formatValue(rawVal)}` : `${dimName}: No Data Available`;
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
                        <div key={state.name} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col items-center" style={{ height: '600px' }}>
                            <div className="flex items-center gap-3 mb-6 w-full pb-4 border-b border-[#EBE9FC]">
                                
                                <h3 className="text-xl font-bold text-[#010104]">{state.name}</h3>
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

    const renderBarCharts = () => {
        return (
            <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
                <div className="sticky top-[80px] z-30 bg-[#F9F8FF] flex flex-col items-start gap-3 py-4 -mt-8 -mx-8 px-8 border-b border-[#EBE9FC]">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Indicators</span>
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {usDimensions.map(dim => {
                            const isActive = activeDimension === dim;
                            return (
                                <button
                                    key={dim}
                                    onClick={() => toggleDimension(dim)}
                                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 border ${isActive
                                            ? 'bg-[#010104] text-[#EBE9FC] border-[#010104] shadow-md'
                                            : 'bg-white text-[#010104] hover:bg-gray-50 border-[#EBE9FC]'
                                        }`}
                                >
                                    {dim}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {[activeDimension].map(dimName => {
                    const dimInfo = usDimensionsMap[dimName];
                    const metric = dimInfo.key;

                    const labels = [];
                    const dataPoints = [];
                    const backgroundColors = [];
                    const borderColors = [];

                    selectedStates.forEach((state, idx) => {
                        const latest = getLatestValues(state.name);
                        labels.push(state.name);
                        dataPoints.push(latest[metric]);
                        const color = stateColors[idx % stateColors.length];
                        backgroundColors.push(color + '80'); // 50% opacity
                        borderColors.push(color);
                    });

                    const data = {
                        labels,
                        datasets: [
                            {
                                label: dimInfo.label,
                                data: dataPoints,
                                backgroundColor: backgroundColors,
                                borderColor: borderColors,
                                borderWidth: 2,
                                borderRadius: 4,
                            }
                        ]
                    };

                    const options = {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        if (context.parsed.y !== null && context.parsed.y !== undefined) {
                                            return `${dimInfo.label}: ${formatValue(context.parsed.y)}`;
                                        }
                                        return `${dimInfo.label}: No Data`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    };

                    return (
                        <div key={dimName} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col" style={{ height: '400px' }}>
                            <h3 className="text-xl font-bold mb-4 text-[#010104]">{dimInfo.label}</h3>
                            <div className="flex-1 relative w-full h-full">
                                <Bar data={data} options={options} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPolarAreaCharts = () => {

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 z-10 relative bg-[#F9F8FF] w-full">
                {selectedStates.map((state, idx) => {
                    const latest = getLatestValues(state.name);

                    const isMissing = usDimensions.map(dim => {
                        const raw = latest[usDimensionsMap[dim].key];
                        return raw === undefined || raw === null;
                    });

                    const dataPoints = usDimensions.map((dim, i) => {
                        if (isMissing[i]) return 100;
                        const raw = latest[usDimensionsMap[dim].key];
                        return (raw / usDimensionsMap[dim].max) * 100;
                    });

                    const bgColors = usDimensions.map((_, i) => isMissing[i] ? 'rgba(229, 231, 235, 0.4)' : stateColors[i % stateColors.length] + '80');
                    const bdColors = usDimensions.map((_, i) => isMissing[i] ? '#9ca3af' : stateColors[i % stateColors.length]);

                    const data = {
                        labels: usDimensions,
                        datasets: [
                            {
                                label: state.name,
                                data: dataPoints,
                                backgroundColor: bgColors,
                                borderColor: bdColors,
                                borderWidth: 1,
                                borderDash: (ctx) => isMissing[ctx.dataIndex] ? [5, 5] : []
                            }
                        ]
                    };

                    const options = {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: 20 },
                        scales: {
                            r: {
                                min: 0,
                                max: 100,
                                ticks: { display: false, stepSize: 20 },
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                angleLines: { display: true, color: 'rgba(0,0,0,0.1)' }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: { size: 11, weight: 'bold' }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const dimName = usDimensions[context.dataIndex];
                                        const rawVal = latest[usDimensionsMap[dimName].key];
                                        return (rawVal !== null && rawVal !== undefined) ? `${dimName}: ${formatValue(rawVal)}` : `${dimName}: No Data Available`;
                                    }
                                }
                            }
                        }
                    };

                    return (
                        <div key={state.name} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col items-center" style={{ height: '600px' }}>
                            <div className="flex items-center gap-3 mb-6 w-full pb-4 border-b border-[#EBE9FC]">
                                
                                <h3 className="text-xl font-bold text-[#010104]">{state.name}</h3>
                            </div>
                            <div className="flex-1 relative w-full h-full px-4">
                                <PolarArea data={data} options={options} />
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

    const renderDataTable = () => {
        return (
            <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
                <div className="bg-white rounded-3xl shadow-sm border border-[#EBE9FC] w-full overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-[#EBE9FC]">
                                    <th className="p-4 font-bold text-[#010104] whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-[#EBE9FC]">State</th>
                                    {usDimensions.map(dim => (
                                        <th key={dim} className="p-4 font-bold text-gray-600 whitespace-nowrap min-w-[150px]">{dim}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedStates.map(state => {
                                    const latest = getLatestValues(state.name);
                                    return (
                                        <tr key={state.name} className="border-b border-gray-100 hover:bg-[#F9F8FF] transition-colors">
                                            <td className="p-4 font-bold text-[#010104] flex items-center gap-3 sticky left-0 bg-white z-10 border-r border-[#EBE9FC]">
                                                
                                                {state.name}
                                            </td>
                                            {usDimensions.map(dim => {
                                                const val = latest[usDimensionsMap[dim].key];
                                                return (
                                                    <td key={dim} className="p-4 font-medium text-gray-600">
                                                        {val !== null && val !== undefined ? formatValue(val) : <span className="text-gray-400">N/A</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                {selectedStates.length === 0 && (
                                    <tr>
                                        <td colSpan={usDimensions.length + 1} className="p-8 text-center text-gray-500">
                                            No countries selected.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderScatterChart = () => {
        const xDim = usDimensionsMap[scatterX];
        const yDim = usDimensionsMap[scatterY];

        const datasets = selectedStates.map((state, idx) => {
            const sData = chartData[state.name] || [];
            const color = stateColors[idx % stateColors.length];

            const points = [];
            sData.forEach(d => {
                if (!d.is_forecast && d[xDim.key] !== null && d[xDim.key] !== undefined && d[yDim.key] !== null && d[yDim.key] !== undefined) {
                    points.push({
                        x: d[xDim.key],
                        y: d[yDim.key],
                        year: d.year
                    });
                }
            });

            return {
                label: state.name,
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
                        label: function (context) {
                            const pt = context.raw;
                            return `${context.dataset.label} (${pt.year}): ${scatterX}=${formatValue(pt.x)}, ${scatterY}=${formatValue(pt.y)}`;
                        }
                    }
                }
            }
        };

        return (
            <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col" style={{ height: 'calc(100vh - 400px)', minHeight: '300px' }}>
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
                                    {usDimensions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-500">X-Axis:</label>
                                <select
                                    value={scatterX}
                                    onChange={e => setScatterX(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold bg-gray-50 focus:outline-none focus:border-indigo-500"
                                >
                                    {usDimensions.map(d => <option key={d} value={d}>{d}</option>)}
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
        if (selectedStates.length === 0) {
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
                <div className={`sticky top-0 z-40 bg-[#F9F8FF] flex justify-between items-center px-8 py-4 -mt-4 border-b ${viewTab === 'time' || viewTab === 'bar' ? 'border-transparent' : 'border-[#EBE9FC]'}`}>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setViewTab("time")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "time" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <LineChart size={18} /> Time Series
                        </button>
                        <button
                            onClick={() => setViewTab("bar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "bar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <BarChart2 size={18} /> Bar Chart
                        </button>
                        <button
                            onClick={() => setViewTab("radar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "radar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <Hexagon size={18} /> Radar View
                        </button>
                        <button
                            onClick={() => setViewTab("polar")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "polar" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <PieChart size={18} /> Polar Area
                        </button>
                        <button
                            onClick={() => setViewTab("scatter")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "scatter" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="2" /><circle cx="12" cy="11" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="16" cy="18" r="2" /><circle cx="7" cy="8" r="2" /></svg> Correlation
                        </button>
                        <button
                            onClick={() => setViewTab("table")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all shadow-sm border ${viewTab === "table" ? "bg-[#010104] text-[#EBE9FC] border-[#010104]" : "bg-white text-gray-600 hover:text-[#010104] border-[#EBE9FC] hover:border-gray-300"}`}
                        >
                            <Table size={18} /> Data Table
                        </button>
                    </div>

                    {/* AI Forecast & Download */}
                    <div className="flex gap-4">
                        {viewTab === "table" && (
                            <button
                                onClick={handleDownloadCSV}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm border bg-white text-gray-500 border-[#EBE9FC] hover:border-gray-300 hover:text-[#010104]"
                            >
                                <Download size={18} /> Download CSV
                            </button>
                        )}

                        {viewTab === "time" && (
                            <button
                                onClick={() => setShowForecast(!showForecast)}
                                className={`group flex justify-center items-center gap-2 px-5 py-3 w-[220px] rounded-xl font-bold text-[14px] transition-all shadow-sm border ${showForecast ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" : "bg-white text-gray-500 border-[#EBE9FC] hover:border-indigo-200 hover:text-indigo-600"}`}
                            >
                                <Sparkles size={18} className={`transition-colors ${showForecast ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600"}`} />
                                {showForecast ? "5-Year Forecast Active" : "Enable AI Forecast"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Render Selected View */}
                <div id="analysis-workspace-content" className="w-full bg-[#F9F8FF] rounded-3xl pb-4">
                    {viewTab === "time" && renderTimeCharts()}
                    {viewTab === "bar" && renderBarCharts()}
                    {viewTab === "radar" && renderRadarCharts()}
                    {viewTab === "polar" && renderPolarAreaCharts()}
                    {viewTab === "scatter" && renderScatterChart()}
                    {viewTab === "table" && renderDataTable()}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-12 px-6 flex flex-col items-center bg-[#F9F8FF]">
            <div className="w-[90vw] max-w-[1600px] flex flex-col gap-8">

                {/* Header Section (Light Mode) */}
                <div className="flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-sm border border-[#EBE9FC]">
                    <div className="flex justify-between items-center w-full">
                        <h1 className="text-4xl font-bold text-[#010104] tracking-tight">Analysis</h1>
                        <button
                            onClick={() => navigate('/country/usa')}
                            className="text-[#010104] hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Countries Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedStates.map(state => {
                            const stateObj = statesList.find(s => s.name === state.name);
                            return (
                                <div key={state.name} className="flex items-center gap-2 bg-[#010104] text-[#EBE9FC] px-4 py-2 rounded-full font-bold text-sm shadow-md group transition-all">
                                    {stateObj && <img src={`https://flagcdn.com/w40/us-${stateObj.iso2.toLowerCase()}.png`} alt="flag" className="w-5 h-auto rounded-sm object-cover" />}
                                    <span>{state.name}</span>
                                    <button
                                        onClick={() => removeState(state.name)}
                                        className="ml-1 opacity-60 hover:opacity-100 hover:text-white transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#EBE9FC] text-[#010104] hover:bg-[#dcd9fa] px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span>Add State</span>
                        </button>
                    </div>

                </div>

                {/* Main Workspace */}
                <div className="w-full flex justify-center">
                    {renderWorkspace()}
                </div>

            </div>

            {/* Add State Modal */}
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
                                    <MapIcon size={18} /> 2D Map
                                </button>
                                <button
                                    onClick={() => setModalTab("list")}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${modalTab === "list" ? "bg-white text-[#010104] shadow-sm" : "text-gray-500 hover:text-[#010104]"}`}
                                >
                                    <List size={18} /> List View
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
                                    <USMap
                                        onStateSelect={handleAddState}
                                        selectedStates={selectedStates}
                                    />
                                </div>
                            ) : (
                                <div className="absolute inset-0 border border-[#EBE9FC] rounded-2xl overflow-hidden shadow-sm m-4">
                                    <StatesList
                                        onSelect={handleAddState}
                                        selectedStates={selectedStates}
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
