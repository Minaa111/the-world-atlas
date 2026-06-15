import React from 'react';

export default function DataTableView({
    entities,
    entityKeyField,
    chartData,
    dimensions,
    dimensionsMap,
    formatValue,
    hiddenCountries,
    hiddenColumns
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



    const visibleDimensions = dimensions.filter(dim => !hiddenColumns.has(dim));

    return (
        <div className="flex flex-col w-full h-full p-6 z-10 relative bg-white overflow-hidden">
            <div className="w-full flex-1 overflow-y-auto rounded-xl border border-[#EBE9FC]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-[#EBE9FC]">
                                <th className="p-4 font-bold text-[#010104] whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-[#EBE9FC]">
                                    {entityKeyField === 'iso3' ? 'Country' : 'State'}
                                </th>
                                {visibleDimensions.map(dim => (
                                    <th key={dim} className="p-4 font-bold text-gray-600 whitespace-nowrap min-w-[150px]">{dim}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {entities.filter(e => !hiddenCountries?.has(e[entityKeyField])).map(entity => {
                                const latest = getLatestValues(entity[entityKeyField]);
                                return (
                                    <tr key={entity[entityKeyField]} className="border-b border-gray-100 hover:bg-[#F9F8FF] transition-colors">
                                        <td className="p-4 font-bold text-[#010104] flex items-center gap-3 sticky left-0 bg-white z-10 border-r border-[#EBE9FC]">
                                            {entity.code && (
                                                <img
                                                    src={`https://flagcdn.com/w20/${entityKeyField === 'iso3' ? entity.code.toLowerCase() : 'us-' + entity.code.toLowerCase()}.png`}
                                                    alt="flag"
                                                    className="w-5 h-auto rounded-sm shadow-sm"
                                                />
                                            )}
                                            {entity.name}
                                        </td>
                                        {visibleDimensions.map(dim => {
                                            const val = latest[dimensionsMap[dim].key];
                                            return (
                                                <td key={dim} className="p-4 text-gray-600">
                                                    {val !== null && val !== undefined ? formatValue(val) : <span className="text-gray-300">N/A</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            {entities.length === 0 && (
                                <tr>
                                    <td colSpan={dimensions.length + 1} className="p-8 text-center text-gray-500">
                                        No {entityKeyField === 'iso3' ? 'countries' : 'states'} selected.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
