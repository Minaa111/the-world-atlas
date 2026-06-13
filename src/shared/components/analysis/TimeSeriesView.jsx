import React from 'react';
import { Line } from 'react-chartjs-2';

export default function TimeSeriesView({ 
    entities, 
    entityKeyField, 
    chartData, 
    dimensions,
    activeDimension,
    toggleDimension,
    dimensionsMap, 
    showForecast, 
    entityColors, 
    formatValue 
}) {
    // Determine which dimensions to render based on activeDimension
    const dimensionsToRender = [activeDimension];

    return (
        <div className="flex flex-col w-full gap-8 p-8 z-10 relative bg-[#F9F8FF]">
            <div className="sticky top-[80px] z-30 bg-[#F9F8FF] flex flex-col items-start gap-3 py-4 -mt-8 -mx-8 px-8 border-b border-[#EBE9FC]">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Indicators</span>
                <div className="flex flex-wrap items-center gap-3 w-full">
                    {dimensions.map(dim => {
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

            {dimensionsToRender.map(dimName => {
                const dimInfo = dimensionsMap[dimName];
                const metric = dimInfo.key;

                const allYears = new Set();
                entities.forEach(entity => {
                    const cData = chartData[entity[entityKeyField]] || [];
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
                                    <path d="M3 3V21H21" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 14L11 10L15 14L21 8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-gray-400 font-medium">No data available for the selected {entityKeyField === 'iso3' ? 'countries' : 'states'}.</p>
                            </div>
                        </div>
                    );
                }

                const datasets = entities.flatMap((entity, idx) => {
                    const cData = chartData[entity[entityKeyField]] || [];
                    const color = entityColors[idx % entityColors.length];

                    // Historical Data
                    const histRecords = cData.filter(d => !d.is_forecast && d[metric] !== null && d[metric] !== undefined);
                    const lastHist = histRecords.length > 0 ? histRecords[histRecords.length - 1] : null;

                    const histPoints = sortedYears.map(y => {
                        const rec = cData.find(d => d.year === y && !d.is_forecast);
                        return rec && rec[metric] !== null ? rec[metric] : null;
                    });

                    const hasData = histPoints.some(val => val !== null);

                    const datasetList = [{
                        label: entity.name + (hasData ? "" : " (No Data)"),
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
                                label: `${entity.name} (Forecast)`,
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
                                    return !item.text.includes('(Forecast)');
                                }
                            },
                            onClick: function (e, legendItem, legend) {
                                const index = legendItem.datasetIndex;
                                const chart = legend.chart;
                                const meta = chart.getDatasetMeta(index);
                                const isHidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                                meta.hidden = isHidden;

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
}
