import React from 'react';
import { Bar } from 'react-chartjs-2';

export default function BarView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    activeDimension,
    toggleDimension,
    getEntityColor,
    formatValue,
    hiddenCountries,
    playbackYear
}) {
    const getValuesForYear = (entityId) => {
        const cData = chartData[entityId] || [];
        const latest = {};
        dimensions.forEach(dim => {
            const dimInfo = dimensionsMap[dim];
            const records = cData.filter(d => !d.is_forecast && d[dimInfo.key] !== null && d[dimInfo.key] !== undefined && d.year <= playbackYear);
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

            {[activeDimension].map(dimName => {
                const dimInfo = dimensionsMap[dimName];
                const metric = dimInfo.key;

                const labels = [];
                const dataPoints = [];
                const backgroundColors = [];
                const borderColors = [];

                entities.forEach((entity, idx) => {
                    if (hiddenCountries?.has(entity[entityKeyField])) return;

                    const latest = getValuesForYear(entity[entityKeyField]);
                    labels.push(entity.name);
                    dataPoints.push(latest[metric]);
                    const color = getEntityColor(entity[entityKeyField], idx);
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
                        <div className="w-full text-center mt-4 text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg flex flex-col gap-1">
                            <span>* Showing latest data up to {playbackYear}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
