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
    getEntityColor,
    formatValue,
    hiddenCountries,
    playbackYear
}) {
    const xDim = dimensionsMap[scatterX];
    const yDim = dimensionsMap[scatterY];

    const datasets = entities.flatMap((entity, idx) => {
        if (hiddenCountries?.has(entity[entityKeyField])) return [];

        const cData = chartData[entity[entityKeyField]] || [];
        const color = getEntityColor(entity[entityKeyField], idx);

        const points = [];
        const records = cData.filter(d => !d.is_forecast && d[xDim.key] !== null && d[xDim.key] !== undefined && d[yDim.key] !== null && d[yDim.key] !== undefined && d.year <= playbackYear);
        
        records.forEach(r => {
            points.push({
                x: r[xDim.key],
                y: r[yDim.key],
                year: r.year
            });
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
                <div className="flex-1 relative w-full min-h-0">
                    <Scatter data={data} options={options} />
                </div>
                <div className="w-full text-center mt-4 text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg flex flex-col gap-1">
                    <span>* Showing latest intersecting data up to {playbackYear}</span>
                </div>
            </div>
        </div>
    );
}
