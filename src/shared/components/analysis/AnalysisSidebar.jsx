import React, { useState } from 'react';
import { 
    LineChart, BarChart2, Hexagon, PieChart, Table, 
    Sparkles, Download, Plus, GripVertical, X, Eye, EyeOff,
    Maximize, Columns2, Columns3, Columns4, CheckSquare, Square,
    ChevronDown, ChevronRight
} from 'lucide-react';
import IndicatorSelector from './IndicatorSelector';
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from '@headlessui/react';
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

const globalDimensionsMap = getDimensionsMap();

const presetColors = ['#010104', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

function SortableCountryItem({ country, color, onRemove, chartData, activeDimension, formatValue, isHidden, onToggleVisibility, setCustomColors, entityKeyField = 'iso3', getFlagUrl, dimensionsMap, isColorPickerOpen, onToggleColorPicker }) {
    const entityId = country[entityKeyField] || country.name;
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
    const cData = chartData[entityId] || [];
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
        <div 
            ref={setNodeRef}
            style={style}
            className={`group relative flex flex-col bg-white border rounded-xl shadow-sm transition-all ${
                isHidden ? 'border-gray-200 bg-gray-50' : 'border-[#EBE9FC] hover:border-indigo-200 hover:shadow-md'
            }`}
            {...attributes}
        >
            <div className="flex items-center gap-3 p-3 w-full">
                <div 
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 transition-colors"
                    title="Drag to reorder"
                >
                    <GripVertical size={16} />
                </div>
                
                <div className="relative shrink-0 flex items-center justify-center">
                    <button 
                        onClick={onToggleColorPicker}
                        className="w-3 h-3 rounded-full shadow-sm cursor-pointer hover:scale-125 transition-transform outline-none" 
                        style={{ backgroundColor: color }}
                        title="Change color"
                    ></button>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        {country.code && (
                            <img 
                                src={getFlagUrl ? getFlagUrl(country.iso3 || country.code) : `https://flagcdn.com/w20/${(country.iso3 || country.code || '').toLowerCase()}.png`} 
                                alt="flag"
                                className="w-4 h-3 object-cover rounded-[2px]"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className={`font-bold text-sm text-[#010104] truncate ${isHidden ? 'line-through text-gray-400' : ''}`}>{country.name}</span>
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
                        onClick={() => onToggleVisibility(entityId)}
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

            {/* Inline Color Picker Accordion */}
            {isColorPickerOpen && (
                <div className="p-3 bg-gray-50/50 border-t border-[#EBE9FC] rounded-b-xl flex flex-wrap gap-2 w-full justify-center">
                    {presetColors.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                setCustomColors(prev => ({ ...prev, [entityId]: c }));
                                onToggleColorPicker();
                            }}
                            className={`w-6 h-6 rounded-full hover:scale-110 transition-transform shadow-sm ${c === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            )}
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
    getEntityColor, setCustomColors, chartData, activeDimension, setActiveDimension, formatValue,
    hiddenCountries, toggleCountryVisibility,
    gridCols, setGridCols,
    hiddenColumns, setHiddenColumns,
    dimensions,
    dimensionsMap: propDimensionsMap,
    scatterX, setScatterX,
    scatterY, setScatterY,
    handleDownloadPNG,
    playbackYear, setPlaybackYear,
    availableYears,
    isPlaying, setIsPlaying,
    entityKeyField = 'iso3',
    getFlagUrl,
    onExit
}) {
    const navigate = useNavigate();
    
    const [isViewModeOpen, setIsViewModeOpen] = useState(true);
    const [isEntitiesOpen, setIsEntitiesOpen] = useState(true);
    const [isControlsOpen, setIsControlsOpen] = useState(true);
    const [openColorPickerId, setOpenColorPickerId] = useState(null);

    const dimensionsMap = propDimensionsMap || globalDimensionsMap;
    
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
        <div className="w-[360px] h-full flex flex-col bg-white border-r border-[#EBE9FC] shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-20 shrink-0 overflow-hidden">
            {/* Logo / Header */}
            <div className="p-6 border-b border-[#EBE9FC] shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="font-black text-xl text-[#010104] tracking-tight">Analysis</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Command Center</p>
                </div>
                <button 
                    onClick={() => onExit ? onExit() : navigate('/global')}
                    className="text-gray-400 hover:text-[#010104] bg-gray-50 hover:bg-gray-200 p-2 rounded-full transition-colors outline-none"
                    title="Exit Workspace"
                >
                    <X size={18} />
                </button>
            </div>

            {/* View Switcher */}
            <Listbox value={viewTab} onChange={setViewTab}>
                {({ open }) => (
                    <div className={`p-4 border-b border-[#EBE9FC] shrink-0 bg-[#F9F8FF]/30 transition-colors relative ${open ? 'z-[60]' : 'z-10'}`}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">View Mode</span>
                        <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white border border-[#EBE9FC] hover:border-indigo-300 py-2.5 pl-4 pr-10 text-left shadow-sm focus:outline-none transition-colors">
                            <span className="block truncate text-sm font-bold text-[#010104]">
                                {[
                                    { id: 'time', label: 'Time Series' },
                                    { id: 'bar', label: 'Bar Chart' },
                                    { id: 'radar', label: 'Radar View' },
                                    { id: 'polar', label: 'Polar Area' },
                                    { id: 'scatter', label: 'Correlation' },
                                    { id: 'table', label: 'Data Table' }
                                ].find(v => v.id === viewTab)?.label}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            </span>
                        </Listbox.Button>
                        <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="absolute z-[100] mt-1 w-full rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm border border-[#EBE9FC]">
                                {[
                                    { id: 'time', label: 'Time Series', icon: LineChart },
                                    { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
                                    { id: 'radar', label: 'Radar View', icon: Hexagon },
                                    { id: 'polar', label: 'Polar Area', icon: PieChart },
                                    { id: 'scatter', label: 'Correlation', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="2" /><circle cx="12" cy="11" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="16" cy="18" r="2" /><circle cx="7" cy="8" r="2" /></svg> },
                                    { id: 'table', label: 'Data Table', icon: Table }
                                ].map((view) => {
                                    const Icon = view.icon;
                                    return (
                                        <Listbox.Option
                                            key={view.id}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2.5 pl-4 pr-4 ${
                                                    active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                                                }`
                                            }
                                            value={view.id}
                                        >
                                            {({ selected }) => (
                                                <div className="flex items-center gap-3">
                                                    <Icon size={16} className={selected ? 'text-indigo-600' : 'text-gray-400'} />
                                                    <span className={`block truncate ${selected ? 'font-black text-indigo-600' : 'font-medium'}`}>
                                                        {view.label}
                                                    </span>
                                                </div>
                                            )}
                                        </Listbox.Option>
                                    );
                                })}
                            </Listbox.Options>
                        </Transition>
                        </div>
                    </div>
                )}
            </Listbox>

            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-[#F9F8FF]/30">
                {/* Roster */}
                <div className="flex flex-col border-b border-[#EBE9FC]">
                    <button 
                        onClick={() => setIsEntitiesOpen(!isEntitiesOpen)}
                    className="w-full flex items-center justify-between p-4 outline-none hover:bg-gray-50 transition-colors shrink-0"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Entities ({selectedCountries.length})</span>
                    <div className="flex items-center gap-3">
                        <span 
                            onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(true); }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                        >
                            <Plus size={14} /> Add
                        </span>
                        {isEntitiesOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                    </div>
                </button>
                
                {isEntitiesOpen && (
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={selectedCountries.map(c => c.name)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-1 -mx-2 px-2">
                                    {selectedCountries.map((country, idx) => (
                                        <SortableCountryItem 
                                            key={country.name} 
                                            country={country} 
                                            color={getEntityColor(country[entityKeyField] || country.name, idx)}
                                            onRemove={removeCountry}
                                            chartData={chartData}
                                            activeDimension={activeDimension}
                                            formatValue={formatValue}
                                            isHidden={hiddenCountries?.has(country[entityKeyField] || country.name)}
                                            onToggleVisibility={toggleCountryVisibility}
                                            setCustomColors={setCustomColors}
                                            entityKeyField={entityKeyField}
                                            getFlagUrl={getFlagUrl}
                                            dimensionsMap={dimensionsMap}
                                            isColorPickerOpen={openColorPickerId === (country[entityKeyField] || country.name)}
                                            onToggleColorPicker={() => {
                                                const id = country[entityKeyField] || country.name;
                                                setOpenColorPickerId(prev => prev === id ? null : id);
                                            }}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </div>
            </div>

            {/* Actions & Settings (Pinned to bottom) */}
            <div className="bg-gray-50 border-t border-[#EBE9FC] shrink-0 z-50">
                <button 
                    onClick={() => setIsControlsOpen(!isControlsOpen)}
                    className="w-full flex items-center justify-between p-4 outline-none hover:bg-gray-100 transition-colors"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Controls</span>
                    {isControlsOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </button>
                
                {isControlsOpen && (
                    <div className="flex flex-col gap-4 px-4 pb-6">
                        {(viewTab === 'time' || viewTab === 'bar') && (
                            <div className="flex flex-col gap-2 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Indicator</span>
                                <IndicatorSelector 
                                    activeDimension={activeDimension} 
                                    onChange={setActiveDimension} 
                                    dimensionsMap={dimensionsMap}
                                    dimensions={dimensions} 
                                    isLocal={!!propDimensionsMap}
                                />
                            </div>
                        )}

                        {viewTab === 'scatter' && (
                            <div className="flex flex-col gap-3 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correlation Axes</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Y-Axis</span>
                                    <IndicatorSelector 
                                        activeDimension={scatterY} 
                                        onChange={setScatterY} 
                                        dimensionsMap={dimensionsMap}
                                        dimensions={dimensions} 
                                        isLocal={!!propDimensionsMap}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">X-Axis</span>
                                    <IndicatorSelector 
                                        activeDimension={scatterX} 
                                        onChange={setScatterX} 
                                        dimensionsMap={dimensionsMap}
                                        dimensions={dimensions} 
                                        isLocal={!!propDimensionsMap}
                                    />
                                </div>
                            </div>
                        )}
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

                    {(viewTab === 'table' || viewTab === 'radar' || viewTab === 'polar') && dimensions && (
                        <div className="flex flex-col gap-2 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visible Indicators</span>
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
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors border outline-none ${
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

                    {(viewTab === 'radar' || viewTab === 'polar') && (
                        <div className="flex flex-col gap-2 p-3 bg-white border border-[#EBE9FC] rounded-xl shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grid Columns</span>
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                {[1, 2, 3].map(num => (
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
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                        </div>
                    )}
                </div>
            
            {/* Time Lapse Playback Controls (Pinned to bottom) */}
            {availableYears?.length > 0 && viewTab !== 'time' && (
                <div className="p-4 border-t border-[#EBE9FC] bg-white shrink-0 flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time-Series Tracking</span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md outline-none'}`}
                        >
                            {isPlaying ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                        </button>
                        
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{availableYears[0]}</span>
                            <input 
                                type="range" 
                                min={0}
                                max={availableYears.length - 1}
                                value={availableYears.indexOf(playbackYear) !== -1 ? availableYears.indexOf(playbackYear) : 0}
                                onChange={(e) => {
                                    setIsPlaying(false);
                                    setPlaybackYear(availableYears[parseInt(e.target.value)]);
                                }}
                                className="flex-1 accent-indigo-600 outline-none"
                            />
                            <span className="text-[10px] font-bold text-gray-400 w-8">{availableYears[availableYears.length - 1]}</span>
                        </div>
                        
                        <div className="px-2 py-1 bg-[#F9F8FF] rounded-lg shadow-sm border border-[#EBE9FC] min-w-[48px] text-center shrink-0">
                            <span className="text-xs font-black text-indigo-600 tracking-wider">{playbackYear}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Bottom Section */}
            <div className="p-4 border-t border-[#EBE9FC] bg-white shrink-0">
                <div className="relative">
                    <Listbox>
                        <div className="relative">
                            <Listbox.Button disabled={isExporting || selectedCountries.length === 0} className="relative w-full flex items-center justify-center gap-2 cursor-default rounded-xl bg-[#010104] hover:bg-gray-800 text-white py-3 px-4 shadow-sm focus:outline-none transition-colors disabled:opacity-50">
                                <Download size={16} /> 
                                <span className="block truncate text-sm font-bold">
                                    {isExporting ? 'Exporting...' : 'Export View'}
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={React.Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="absolute bottom-full mb-2 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm border border-[#EBE9FC] z-50">
                                    <Listbox.Option value="png" className="relative cursor-default select-none py-3 pl-4 pr-4 hover:bg-gray-50 border-b border-gray-100" onClick={handleDownloadPNG}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">📷</div> 
                                            <span className="font-bold text-gray-900">High-Res PNG</span>
                                        </div>
                                    </Listbox.Option>
                                    <Listbox.Option value="pdf" className="relative cursor-default select-none py-3 pl-4 pr-4 hover:bg-gray-50 border-b border-gray-100" onClick={handleDownloadPDF}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-red-50 text-red-600 flex items-center justify-center">📄</div> 
                                            <span className="font-bold text-gray-900">PDF Document</span>
                                        </div>
                                    </Listbox.Option>
                                    <Listbox.Option value="csv" className="relative cursor-default select-none py-3 pl-4 pr-4 hover:bg-gray-50" onClick={handleDownloadCSV}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-green-50 text-green-600 flex items-center justify-center">📊</div> 
                                            <span className="font-bold text-gray-900">CSV Data</span>
                                        </div>
                                    </Listbox.Option>
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>
                </div>
            </div>
        </div>
    );
}
