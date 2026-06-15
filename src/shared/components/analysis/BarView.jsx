import React from 'react';
import { Bar } from 'react-chartjs-2';
import IndicatorSelector from './IndicatorSelector';

export default function BarView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    activeDimension,
    toggleDimension,
    entityColors,
    formatValue,
    hiddenCountries
}) {
    const getLatestValues = (entityId) => {
        const cData = chartData[entityId] || [];
        const latest = {};
        dimensions.forEach(dim => {
            const dimInfo = dimensionsMap[dim];
            const records = cData.filter(d => !d.is_forecast && d[dimInfo.key] !== null && d[dimInfo.key] !== undefined);
            if (records.length > 0) {
                const sorted = [...records].sort((a, b) => b.year - a.year);
                latest[dimInfo.key] = sorted[0][dimInfo.key];
            } else {
                latest[dimInfo.key] = null;
            }
        });
        return latest;
    };

    return (
        <div className="flex flex-col w-full h-full z-10 relative bg-white">
            <div className="flex items-center justify-between gap-3 p-6 border-b border-[#EBE9FC] shrink-0">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Indicator</span>
                <div className="flex-1 max-w-md">
                    <IndicatorSelector activeDimension={activeDimension} onChange={toggleDimension} />
                </div>
            </div>

            {[activeDimension].map(dimName => {
                const dimInfo = dimensionsMap[dimName];
                const metric = dimInfo.key;

                const labels = [];
                const dataPoints = [];
                const backgroundColors = [];
                const borderColors = [];

                entities.forEach((entity, idx) => {
                    if (hiddenCountries?.has(entity[entityKeyField])) return;

                    const latest = getLatestValues(entity[entityKeyField]);
                    labels.push(entity.name);
                    dataPoints.push(latest[metric]);
                    const color = entityColors[idx % entityColors.length];
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
                    <div key={dimName} className="flex-1 w-full flex flex-col p-6 min-h-0">
                        <h3 className="text-xl font-bold mb-4 text-[#010104] shrink-0">{dimInfo.label}</h3>
                        <div className="flex-1 relative w-full min-h-0">
                            <Bar data={data} options={options} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
