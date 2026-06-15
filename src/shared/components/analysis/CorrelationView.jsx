import React from 'react';
import { Scatter } from 'react-chartjs-2';
import IndicatorSelector from './IndicatorSelector';

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
    formatValue,
    hiddenCountries
}) {
    const xDim = dimensionsMap[scatterX];
    const yDim = dimensionsMap[scatterY];

    const datasets = entities.flatMap((entity, idx) => {
        if (hiddenCountries?.has(entity[entityKeyField])) return [];

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

        return [{
            label: entity.name,
            data: points,
            backgroundColor: color,
            pointRadius: 6,
            pointHoverRadius: 8
        }];
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
        <div className="flex flex-col w-full h-full z-10 relative bg-white p-6">
            <div className="flex-1 w-full flex flex-col min-h-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-[#010104]">Correlation Analysis</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500">Y-Axis:</label>
                            <div className="w-[240px]">
                                <IndicatorSelector activeDimension={scatterY} onChange={setScatterY} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500">X-Axis:</label>
                            <div className="w-[240px]">
                                <IndicatorSelector activeDimension={scatterX} onChange={setScatterX} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative w-full min-h-0">
                    <Scatter data={data} options={options} />
                </div>
                <div className="w-full text-center mt-4 text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg">
                    * Each point represents a single year where data exists for both selected dimensions.
                </div>
            </div>
        </div>
    );
}
