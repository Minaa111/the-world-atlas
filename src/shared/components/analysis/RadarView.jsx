import React from 'react';
import { Radar } from 'react-chartjs-2';

export default function RadarView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    getEntityColor,
    formatValue,
    globalMaxValues,
    hiddenCountries,
    gridCols,
    hiddenColumns,
    playbackYear
}) {
    const visibleDimensions = dimensions.filter(dim => !hiddenColumns?.has(dim));

    const getValuesForYear = (entityId) => {
        const cData = chartData[entityId] || [];
        const latest = {};
        visibleDimensions.forEach(dim => {
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

    const gridClassMap = {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4'
    };

    const isMultiColumn = dimensions.length > 8;
    const tooltipClasses = `absolute bottom-full mb-3 bg-[#010104] text-white text-[11px] rounded-xl p-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none grid gap-x-8 gap-y-2 z-[60] shadow-2xl border border-gray-800 -translate-x-1/2 left-1/2 ${
        isMultiColumn ? 'w-[480px] grid-cols-2 grid-flow-col' : 'w-max min-w-[240px] grid-cols-1 grid-flow-row'
    }`;
    const tooltipStyle = isMultiColumn ? { gridTemplateRows: `repeat(${Math.ceil(dimensions.length / 2)}, minmax(0, 1fr))` } : {};

    const maxTooltipContent = (
        <div className={tooltipClasses} style={tooltipStyle}>
            {dimensions.map(dim => {
                const key = dimensionsMap[dim].key;
                let maxStr = formatValue(globalMaxValues[key]);
                if (maxStr.endsWith('.00')) maxStr = maxStr.slice(0, -3);
                return (
                    <div key={dim} className="flex justify-between items-center gap-4 border-b border-gray-800/50 pb-1">
                        <span className="text-gray-400 font-medium">{dimensionsMap[dim].shortLabel || dim}:</span>
                        <span className="font-mono text-gray-100">{maxStr}</span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col w-full h-full p-6 z-10 relative bg-white overflow-hidden">
            <div className={`grid grid-cols-1 ${gridClassMap[gridCols]} gap-6 flex-1 overflow-y-auto min-h-0 pb-6`}>
                {entities.filter(e => !hiddenCountries?.has(e[entityKeyField])).map((entity, idx) => {
                    const latest = getValuesForYear(entity[entityKeyField]);
                    const color = getEntityColor(entity[entityKeyField], idx);

                    const dataPoints = visibleDimensions.map(dim => {
                        const raw = latest[dimensionsMap[dim].key];
                        if (raw === undefined || raw === null) return null;
                        return Math.min((raw / globalMaxValues[dimensionsMap[dim].key]) * 100, 100);
                    });

                    const data = {
                        labels: visibleDimensions.map(dim => dimensionsMap[dim]?.shortLabel || dim),
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
                                    padding: 10,
                                    font: { size: 10, weight: 'bold' },
                                    color: function (context) {
                                        const dimName = visibleDimensions[context.index];
                                        const raw = latest[dimensionsMap[dimName].key];
                                        return (raw === undefined || raw === null) ? '#9ca3af' : '#010104';
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
                                        const dimName = visibleDimensions[context.dataIndex];
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
                                <Radar data={data} options={options} plugins={[centerPointLabelsPlugin]} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none pb-4 z-[50]">
                <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-100/50 text-[11px] font-medium text-slate-400 pointer-events-auto flex items-center gap-1 shadow-sm">
                    * Showing latest data up to {playbackYear || "2025"}. Values are normalized relative to 
                    <div className="relative group cursor-help ml-1">
                        <span className="underline decoration-dashed decoration-slate-300 underline-offset-2 hover:text-indigo-600 transition-colors">global theoretical maximums</span>
                        {maxTooltipContent}
                    </div>.
                </div>
            </div>
        </div>
    );
}
