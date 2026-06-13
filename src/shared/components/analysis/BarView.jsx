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
    entityColors,
    formatValue
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

            {[activeDimension].map(dimName => {
                const dimInfo = dimensionsMap[dimName];
                const metric = dimInfo.key;

                const labels = [];
                const dataPoints = [];
                const backgroundColors = [];
                const borderColors = [];

                entities.forEach((entity, idx) => {
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
}
