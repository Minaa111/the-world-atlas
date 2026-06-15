import React from 'react';
import { PolarArea } from 'react-chartjs-2';

export default function PolarView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    entityColors,
    formatValue,
    globalMaxValues,
    hiddenCountries,
    gridCols
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

    const gridClassMap = {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4'
    };

    return (
        <div className="flex flex-col w-full h-full p-6 z-10 relative bg-white overflow-hidden">
            <div className={`grid grid-cols-1 ${gridClassMap[gridCols]} gap-6 flex-1 overflow-y-auto min-h-0 pb-6`}>
            {entities.filter(e => !hiddenCountries?.has(e[entityKeyField])).map((entity, idx) => {
                const latest = getLatestValues(entity[entityKeyField]);

                const isMissing = dimensions.map(dim => {
                    const raw = latest[dimensionsMap[dim].key];
                    return raw === undefined || raw === null;
                });

                const dataPoints = dimensions.map((dim, i) => {
                    if (isMissing[i]) return 100;
                    const raw = latest[dimensionsMap[dim].key];
                    return (raw / globalMaxValues[dimensionsMap[dim].key]) * 100;
                });

                const bgColors = dimensions.map((_, i) => isMissing[i] ? 'rgba(229, 231, 235, 0.4)' : entityColors[i % entityColors.length] + '80');
                const bdColors = dimensions.map((_, i) => isMissing[i] ? '#9ca3af' : entityColors[i % entityColors.length]);

                const data = {
                    labels: dimensions,
                    datasets: [
                        {
                            label: entity.name,
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
                                    const dimName = dimensions[context.dataIndex];
                                    const rawVal = latest[dimensionsMap[dimName].key];
                                    return (rawVal !== null && rawVal !== undefined) ? `${dimName}: ${formatValue(rawVal)}` : `${dimName}: No Data Available`;
                                }
                            }
                        }
                    }
                };

                return (
                    <div key={entity[entityKeyField]} className="bg-gray-50 p-6 rounded-3xl border border-[#EBE9FC] w-full flex flex-col items-center" style={{ height: '600px' }}>
                        <div className="flex items-center gap-3 mb-6 w-full pb-4 border-b border-[#EBE9FC]">
                            {entity.code && (
                                <img
                                    src={`https://flagcdn.com/w40/${entityKeyField === 'iso3' ? entity.code.toLowerCase() : 'us-' + entity.code.toLowerCase()}.png`}
                                    alt="flag"
                                    className="w-8 h-auto rounded shadow-sm border border-gray-100 object-cover"
                                />
                            )}
                            <h3 className="text-xl font-bold text-[#010104]">{entity.name}</h3>
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
        </div>
    );
}
