import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Loader2, Layout, Info, Pin, Map } from 'lucide-react';
import * as d3 from 'd3';
import { countryRegistry } from '../config/countryRegistry';

function CountryDataDirectory() {
  const { countryId } = useParams();
  const navigate = useNavigate();
  const config = countryRegistry[countryId];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'stateName', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`${countryId}DirectoryVisibleColumns`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return config ? config.dimensions : [];
      }
    }
    return config ? config.dimensions : [];
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [pinnedStates, setPinnedStates] = useState(new Set());
  const [toast, setToast] = useState(null);
  
  const columnMenuRef = useRef(null);
  const tableRef = useRef(null);
  
  // Drag to scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Year state
  const [year, setYear] = useState(() => {
      const saved = localStorage.getItem(`${countryId}DirectoryYear`);
      return saved ? parseInt(saved, 10) : 2020;
  });
  const [yearInput, setYearInput] = useState(() => {
      const saved = localStorage.getItem(`${countryId}DirectoryYear`);
      return saved ? saved : '2020';
  });

  useEffect(() => {
      if (!config) navigate('/country/usa');
  }, [config, navigate]);

  useEffect(() => {
    if (config) {
        localStorage.setItem(`${countryId}DirectoryVisibleColumns`, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, countryId, config]);

  useEffect(() => {
      if (config) {
          localStorage.setItem(`${countryId}DirectoryYear`, year.toString());
      }
  }, [year, countryId, config]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!config) return;

    setLoading(true);
    // Simulate API delay
    const timeoutId = setTimeout(() => {
      const regionNames = config.regions.map(r => r.name);
      const rawDataMap = config.mockDataFn(regionNames);
      
      const enrichedData = regionNames.map(stateName => {
        const stateRecords = rawDataMap[stateName] || [];
        // Find record for specific year, fallback to first available if missing
        let record = stateRecords.find(r => r.year === year);
        if (!record && stateRecords.length > 0) record = stateRecords[0];
        
        return {
          ...(record || {}),
          stateName: stateName,
          year: record ? record.year : year
        };
      });
      
      setData(enrichedData);
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [year, config]);

  if (!config) return null;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const activeDimensions = config.dimensions.filter(d => visibleColumns.includes(d));

  const handleCopy = (value, e) => {
    if (isDragging) return;
    e.stopPropagation();
    let textToCopy = value;
    if (value === null || value === undefined) textToCopy = 'N/A';
    else if (typeof value === 'number') {
      textToCopy = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    
    navigator.clipboard.writeText(String(textToCopy));
    setToast(`Copied "${textToCopy}" to clipboard`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleMouseDown = (e) => {
    if (!tableRef.current) return;
    setIsMouseDown(true);
    setIsDragging(false);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setStartY(e.pageY - tableRef.current.offsetTop);
    setScrollLeft(tableRef.current.scrollLeft);
    setScrollTop(tableRef.current.scrollTop);
  };

  const handleMouseLeave = () => setIsMouseDown(false);

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !tableRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const x = e.pageX - tableRef.current.offsetLeft;
    const y = e.pageY - tableRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    tableRef.current.scrollLeft = scrollLeft - walkX;
    tableRef.current.scrollTop = scrollTop - walkY;
  };

  const togglePin = (stateName, e) => {
    e.stopPropagation();
    setPinnedStates(prev => {
      const next = new Set(prev);
      if (next.has(stateName)) next.delete(stateName);
      else next.add(stateName);
      return next;
    });
  };

  const dimensionStats = React.useMemo(() => {
    const stats = {};
    activeDimensions.forEach(dim => {
      const key = config.dimensionsMap[dim].key;
      const values = data.map(r => r[key]).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        stats[key] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });
    return stats;
  }, [data, activeDimensions, config]);

  const getHeatmapColor = (val, dimName) => {
    const dimObj = config.dimensionsMap[dimName];
    if (!heatmapMode || val === null || val === undefined || !dimensionStats[dimObj.key]) return undefined;
    const { min, max } = dimensionStats[dimObj.key];
    if (max === min) return undefined;
    
    let pct = (val - min) / (max - min);
    if (dimObj.invert) pct = 1 - pct;
    
    const hue = pct * 120; // 0 = Red, 120 = Green
    return `hsl(${hue}, 70%, 92%)`;
  };

  const handleYearChange = (e) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) {
          setYear(val);
          setYearInput(String(val));
      }
  };

  const handleYearInputChange = (e) => {
      setYearInput(e.target.value);
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1990 && val <= 2025) {
          setYear(val);
      }
  };

  const sortedData = React.useMemo(() => {
    let filteredData = [...data];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(row => 
        row.stateName.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (config.dimensionsMap[sortConfig.key]) {
            aVal = a[config.dimensionsMap[sortConfig.key].key];
            bVal = b[config.dimensionsMap[sortConfig.key].key];
        }

        if (aVal === undefined || aVal === null) aVal = -Infinity;
        if (bVal === undefined || bVal === null) bVal = -Infinity;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredData;
  }, [data, sortConfig, searchTerm, config]);

  const pinnedRows = sortedData.filter(r => pinnedStates.has(r.stateName));
  const unpinnedRows = sortedData.filter(r => !pinnedStates.has(r.stateName));
  const displayRows = [...pinnedRows, ...unpinnedRows];

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 inline opacity-40" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 inline text-[#3A31D8]" /> 
      : <ArrowDown size={14} className="ml-1 inline text-[#3A31D8]" />;
  };

  const exportCSV = () => {
    if (sortedData.length === 0) return;
    
    const headers = ['Region', ...activeDimensions, 'Data Year'];
    const rows = sortedData.map(row => [
      `"${row.stateName}"`,
      ...activeDimensions.map(d => {
          const key = config.dimensionsMap[d].key;
          return row[key] !== null && row[key] !== undefined ? row[key] : '';
      }),
      row.year
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${countryId}_region_data_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-12 px-6 text-[#010104]">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{config.name} Data Directory</h1>
            <p className="text-gray-600 max-w-2xl">
              Explore data indicators across {config.regions.length} regions. Click on any column header to sort.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setHeatmapMode(!heatmapMode)}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl border transition-all shadow-sm ${
                heatmapMode 
                  ? 'bg-[#3A31D8] text-white border-[#3A31D8]' 
                  : 'bg-[#F9F8FF] text-[#010104] border-[#EBE9FC] hover:bg-[#EBE9FC] hover:text-[#3A31D8]'
              }`}
            >
              <Map size={18} />
              Heatmap
            </button>
            <div className="relative w-56" ref={columnMenuRef}>
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center justify-between gap-2 px-5 py-2.5 w-full bg-[#F9F8FF] text-[#010104] font-bold rounded-xl border border-[#EBE9FC] hover:bg-[#EBE9FC] hover:text-[#3A31D8] transition-all shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Layout size={18} />
                  Columns
                </span>
                <ArrowDown size={14} className="opacity-50" />
              </button>
              {showColumnMenu && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-[#EBE9FC] rounded-xl shadow-lg z-50 p-2">
                  <div className="px-2 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Visible Indicators</div>
                  {config.dimensions.map(dim => (
                    <label key={dim} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(dim)}
                        onChange={() => toggleColumn(dim)}
                        className="w-4 h-4 text-[#3A31D8] rounded border-gray-300 focus:ring-[#3A31D8] cursor-pointer"
                      />
                      <span className="text-sm font-medium text-[#010104]">{dim}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F9F8FF] text-[#010104] font-bold rounded-xl border border-[#EBE9FC] hover:bg-[#EBE9FC] hover:text-[#3A31D8] transition-all shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col xl:flex-row gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-[#EBE9FC]">
          
          {/* Search */}
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Search Region</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#EBE9FC] bg-[#F9F8FF] focus:outline-none focus:ring-2 focus:ring-[#3A31D8]/50 text-[#010104] placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          <div className="hidden xl:block w-[1px] bg-[#EBE9FC] self-stretch"></div>

          {/* Time Slider */}
          <div className="flex-1 max-w-xl flex flex-col justify-center">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500 mb-3">
                <span>1990</span>
                <div className="flex items-center gap-2">
                    <span className="uppercase tracking-wider text-xs">Selected Year:</span>
                    <input 
                        type="number" 
                        min="1990" 
                        max="2025"
                        value={yearInput}
                        onChange={handleYearInputChange}
                        className="w-16 bg-[#F9F8FF] border border-[#EBE9FC] rounded-md px-2 py-1 text-center font-bold text-[#010104] outline-none focus:border-[#3A31D8]"
                    />
                </div>
                <span>2025</span>
            </div>
            <input 
                type="range" 
                min="1990" 
                max="2025" 
                value={year} 
                onChange={handleYearChange}
                className="w-full h-2 bg-[#EBE9FC] rounded-lg appearance-none cursor-pointer accent-[#3A31D8]"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex justify-center items-center rounded-2xl">
              <Loader2 className="animate-spin text-[#3A31D8] w-12 h-12" />
            </div>
          )}
          <div 
            ref={tableRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="bg-white rounded-xl shadow-sm border border-[#EBE9FC] overflow-auto max-h-[65vh] cursor-grab active:cursor-grabbing select-none"
          >
            <table className="w-full text-left text-sm text-[#010104]">
              <thead className="bg-[#F9F8FF] font-bold text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 left-0 bg-[#F9F8FF] z-30 hover:z-50 shadow-[1px_1px_0_0_#EBE9FC] align-middle" onClick={() => handleSort('stateName')}>
                    Region {renderSortIcon('stateName')}
                  </th>
                  {activeDimensions.map((dim) => (
                    <th 
                      key={dim}
                      className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 bg-[#F9F8FF] z-20 hover:z-50 shadow-[0_1px_0_0_#EBE9FC] align-middle"
                      onClick={() => handleSort(dim)}
                    >
                      <div className="flex items-center gap-1.5">
                        {dim} {renderSortIcon(dim)}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 bg-[#F9F8FF] z-20 hover:z-50 shadow-[0_1px_0_0_#EBE9FC] align-middle" onClick={() => handleSort('year')}>
                    Data Year {renderSortIcon('year')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE9FC]">
                {displayRows.map((row, i) => {
                  const isPinned = pinnedStates.has(row.stateName);
                  return (
                  <tr key={row.stateName} className={`transition-colors group ${isPinned ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-bold whitespace-nowrap sticky left-0 z-10 shadow-[1px_0_0_0_#EBE9FC] ${isPinned ? 'bg-[#FFFAF0] group-hover:bg-[#FFF4DF]' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3 w-max">
                        <button 
                          onClick={(e) => togglePin(row.stateName, e)}
                          className={`flex-shrink-0 focus:outline-none transition-colors ${isPinned ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'}`}
                          title={isPinned ? "Unpin region" : "Pin region to top"}
                        >
                          <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                        </button>
                        <span 
                          className="cursor-pointer hover:text-[#3A31D8] transition-colors"
                          onClick={(e) => handleCopy(row.stateName, e)}
                          title="Click to copy"
                        >
                          {row.stateName}
                        </span>
                      </div>
                    </td>
                    {activeDimensions.map(dim => {
                      const key = config.dimensionsMap[dim].key;
                      const val = row[key];
                      return (
                      <td 
                        key={dim} 
                        className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap transition-colors"
                        style={{ backgroundColor: getHeatmapColor(val, dim) }}
                      >
                        <span 
                          className={`cursor-pointer transition-colors hover:text-[#3A31D8] ${val == null ? 'text-gray-300 font-normal' : ''}`}
                          onClick={(e) => handleCopy(val, e)}
                          title="Click to copy"
                        >
                          {val !== null && val !== undefined 
                            ? Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                            : 'N/A'}
                        </span>
                      </td>
                    )})}
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      <span 
                        className="cursor-pointer hover:text-[#3A31D8] transition-colors"
                        onClick={(e) => handleCopy(row.year, e)}
                        title="Click to copy"
                      >
                        {row.year}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {sortedData.length === 0 && !loading && (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-2 text-[#010104]">No data found</p>
                <p className="text-sm">Try adjusting your filters or search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#010104] text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 transition-all">
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default CountryDataDirectory;
