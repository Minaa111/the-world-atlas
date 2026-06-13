import React from 'react';
import { Radar } from 'react-chartjs-2';

export default function RadarView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    entityColors,
    formatValue,
    globalMaxValues
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 z-10 relative bg-[#F9F8FF] w-full">
            {entities.map((entity, idx) => {
                const latest = getLatestValues(entity[entityKeyField]);
                const color = entityColors[idx % entityColors.length];

                const dataPoints = dimensions.map(dim => {
                    const raw = latest[dimensionsMap[dim].key];
                    if (raw === undefined || raw === null) return null;
                    return (raw / globalMaxValues[dimensionsMap[dim].key]) * 100;
                });

                const data = {
                    labels: dimensions,
                    datasets: [
                        {
                            label: entity.name,
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
                                    const dimName = dimensions[context.index];
                                    const raw = latest[dimensionsMap[dimName].key];
                                    return (raw === undefined || raw === null) ? '#9ca3af' : '#010104';
                                },
                                callback: function (value, index) {
                                    const dimName = dimensions[index];
                                    const max = globalMaxValues[dimensionsMap[dimName].key];
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
                                    const dimName = dimensions[context.dataIndex];
                                    const rawVal = latest[dimensionsMap[dimName].key];
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
                    <div key={entity[entityKeyField]} className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC] w-full flex flex-col items-center" style={{ height: '600px' }}>
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
}
