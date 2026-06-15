import React from 'react';
import { 
    LineChart, BarChart2, Hexagon, PieChart, Table, 
    Sparkles, Download, Plus, GripVertical, X, Eye, EyeOff,
    Maximize, Columns2, Columns3, Columns4, CheckSquare, Square
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getDimensionsMap } from '../../config/indicators';

const dimensionsMap = getDimensionsMap();

function SortableCountryItem({ country, color, onRemove, chartData, activeDimension, formatValue, isHidden, onToggleVisibility }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: country.name });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Calculate Delta
    const cData = chartData[country.iso3] || [];
    const dimInfo = dimensionsMap[activeDimension];
    const metric = dimInfo ? dimInfo.key : null;
    
    let latestVal = null;
    let delta = null;
    let deltaPct = null;

    if (metric && cData.length > 0) {
        const sorted = [...cData].filter(d => !d.is_forecast && d[metric] !== null && d[metric] !== undefined).sort((a, b) => b.year - a.year);
        if (sorted.length > 0) {
            latestVal = sorted[0][metric];
            if (sorted.length > 1 && sorted[1][metric] !== 0) {
                const prev = sorted[1][metric];
                delta = latestVal - prev;
                deltaPct = ((delta / prev) * 100).toFixed(1);
            }
        }
    }

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 group transition-colors ${isHidden ? 'opacity-50 grayscale' : ''}`}>
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 rounded outline-none"
            >
                <GripVertical size={16} />
            </div>
            
            <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: color }}></div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    {country.code && (
                        <img
                            src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                            alt="flag"
                            className="w-4 h-3 object-cover rounded-[2px]"
                        />
                    )}
                    <span className={`font-bold text-sm text-[#010104] truncate ${isHidden ? 'line-through' : ''}`}>{country.name}</span>
                </div>
                {latestVal !== null && (
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-medium text-gray-600">{formatValue(latestVal)}</span>
                        {deltaPct !== null && (
                            <span className={`font-bold ${delta > 0 ? (dimInfo.key === 'homicide_rate' || dimInfo.key === 'pm25' || dimInfo.key === 'gini' ? 'text-red-500' : 'text-emerald-500') : (dimInfo.key === 'homicide_rate' || dimInfo.key === 'pm25' || dimInfo.key === 'gini' ? 'text-emerald-500' : 'text-red-500')}`}>
                                {delta > 0 ? '+' : ''}{deltaPct}%
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onToggleVisibility(country.iso3)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors outline-none"
                    title={isHidden ? "Show in charts" : "Hide from charts"}
                >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                    onClick={() => onRemove(country.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors outline-none"
                    title="Remove entity"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default function AnalysisSidebar({ 
    viewTab, setViewTab,
    selectedCountries, setSelectedCountries,
    isAddModalOpen, setIsAddModalOpen,
    removeCountry,
    showForecast, setShowForecast,
    handleDownloadCSV, handleDownloadPDF, isExporting,
    countryColors, chartData, activeDimension, formatValue,
    hiddenCountries, toggleCountryVisibility,
    gridCols, setGridCols,
    hiddenColumns, setHiddenColumns,
    dimensions
}) {
    const navigate = useNavigate();
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSelectedCountries((items) => {
                const oldIndex = items.findIndex(c => c.name === active.id);
                const newIndex = items.findIndex(c => c.name === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="w-[320px] h-full flex flex-col bg-white border-r border-[#EBE9FC] shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-20 shrink-0 overflow-hidden">
            {/* Logo / Header */}
            <div className="p-6 border-b border-[#EBE9FC] shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="font-black text-xl text-[#010104] tracking-tight">Analysis</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Command Center</p>
                </div>
                <button 
                    onClick={() => navigate('/global')}
                    className="text-gray-400 hover:text-[#010104] bg-gray-50 hover:bg-gray-200 p-2 rounded-full transition-colors outline-none"
                    title="Exit Workspace"
                >
                    <X size={18} />
                </button>
            </div>

            {/* View Switcher */}
            <div className="p-6 border-b border-[#EBE9FC] shrink-0">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">View Mode</span>
                <div className="flex flex-col gap-1">
                    {[
                        { id: 'time', label: 'Time Series', icon: LineChart },
                        { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
                        { id: 'radar', label: 'Radar View', icon: Hexagon },
                        { id: 'polar', label: 'Polar Area', icon: PieChart },
                        { id: 'scatter', label: 'Correlation', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="2" /><circle cx="12" cy="11" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="16" cy="18" r="2" /><circle cx="7" cy="8" r="2" /></svg> },
                        { id: 'table', label: 'Data Table', icon: Table }
                    ].map(view => {
                        const Icon = view.icon;
                        const isActive = viewTab === view.id;
                        return (
                            <button
                                key={view.id}
                                onClick={() => setViewTab(view.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all outline-none ${
                                    isActive 
                                    ? 'bg-indigo-50 text-indigo-700' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#010104]'
                                }`}
                            >
                                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                                {view.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Roster */}
            <div className="flex-1 flex flex-col p-6 min-h-0">
                <div className="flex justify-between items-center mb-3 shrink-0">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Entities ({selectedCountries.length})</span>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 outline-none"
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto -mx-2 px-2">
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={selectedCountries.map(c => c.name)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-1">
                                {selectedCountries.map((country, idx) => (
                                    <SortableCountryItem 
                                        key={country.name} 
                                        country={country} 
                                        color={countryColors[idx % countryColors.length]}
                                        onRemove={removeCountry}
                                        chartData={chartData}
                                        activeDimension={activeDimension}
                                        formatValue={formatValue}
                                        isHidden={hiddenCountries?.has(country.iso3)}
                                        onToggleVisibility={toggleCountryVisibility}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* Actions & Settings */}
            <div className="p-6 border-t border-[#EBE9FC] bg-gray-50/50 shrink-0">
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Controls</span>
                <div className="flex flex-col gap-3">
                    {viewTab === 'time' && (
                        <button
                            onClick={() => setShowForecast(!showForecast)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all border outline-none ${
                                showForecast 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                                : 'bg-white text-[#010104] border-[#EBE9FC] hover:border-gray-300 shadow-sm'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles size={16} className={showForecast ? 'text-indigo-200' : 'text-gray-400'} />
                                AI Forecast
                            </span>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${showForecast ? 'bg-indigo-400' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showForecast ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </button>
                    )}

                    {(viewTab === 'radar' || viewTab === 'polar') && (
                        <div className="flex flex-col gap-2 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grid Columns</span>
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setGridCols(num)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex justify-center items-center gap-1 outline-none ${
                                            gridCols === num 
                                            ? 'bg-white text-indigo-600 shadow-sm border border-[#EBE9FC]' 
                                            : 'text-gray-500 hover:text-[#010104]'
                                        }`}
                                    >
                                        {num === 1 && <Maximize size={14} />}
                                        {num === 2 && <Columns2 size={14} />}
                                        {num === 3 && <Columns3 size={14} />}
                                        {num === 4 && <Columns4 size={14} />}
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {viewTab === 'table' && dimensions && (
                        <div className="flex flex-col gap-2 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visible Columns</span>
                            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                {dimensions.map(dim => {
                                    const isHidden = hiddenColumns.has(dim);
                                    return (
                                        <button
                                            key={dim}
                                            onClick={() => {
                                                setHiddenColumns(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(dim)) next.delete(dim);
                                                    else next.add(dim);
                                                    return next;
                                                });
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors border ${
                                                isHidden 
                                                ? 'bg-transparent text-gray-400 border-transparent hover:bg-gray-100' 
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}
                                        >
                                            {isHidden ? <Square size={14} className="shrink-0" /> : <CheckSquare size={14} className="text-indigo-600 shrink-0" />}
                                            <span className="text-xs font-medium truncate">{dim}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="w-full mt-2 pt-4 border-t border-gray-200">
                        {viewTab === 'table' ? (
                            <button
                                onClick={handleDownloadCSV}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-[#EBE9FC] hover:border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-bold text-[#010104] shadow-sm transition-all outline-none"
                            >
                                <Download size={16} className="text-gray-400" /> Download CSV
                            </button>
                        ) : (
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isExporting}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-[#EBE9FC] hover:border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-bold text-[#010104] shadow-sm transition-all disabled:opacity-50 outline-none"
                            >
                                <Download size={16} className="text-gray-400" /> 
                                {isExporting ? 'Exporting...' : 'Export PDF Report'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
