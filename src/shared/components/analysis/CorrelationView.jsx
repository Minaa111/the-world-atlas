import React from 'react';
import { Scatter } from 'react-chartjs-2';

export default function CorrelationView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    scatterX,
    setScatterX,
    scatterY,
    setScatterY,
    entityColors,
    formatValue
}) {
    const xDim = dimensionsMap[scatterX];
    const yDim = dimensionsMap[scatterY];

    const datasets = entities.map((entity, idx) => {
        const cData = chartData[entity[entityKeyField]] || [];
        const color = entityColors[idx % entityColors.length];

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
            label: entity.name,
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
                <div className="flex-1 relative w-full h-full">
                    <Scatter data={data} options={options} />
                </div>
                <div className="w-full text-center mt-4 text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg">
                    * Each point represents a single year where data exists for both selected dimensions.
                </div>
            </div>
        </div>
    );
}
