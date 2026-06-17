import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Loader2, Layout, Info, Pin, Map } from 'lucide-react';
import { countries as countriesData } from '../../global/data/countries';

import { THEMATIC_PILLARS } from '../../shared/config/indicators';

const dimensions = THEMATIC_PILLARS.flatMap(pillar => 
  pillar.indicators.map(ind => ({
    key: ind.key,
    label: ind.label,
    desc: ind.desc,
    invert: ind.invert
  }))
);

const continentsList = ["All", ...new Set(countriesData.map(c => c.continent).filter(Boolean))];

function DataDirectory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'countryName', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('directoryVisibleColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return dimensions.map(d => d.key);
      }
    }
    return dimensions.map(d => d.key);
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [pinnedCountries, setPinnedCountries] = useState(new Set());
  useEffect(() => {
    localStorage.setItem('directoryVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Year state
  const [year, setYear] = useState(() => {
      const saved = localStorage.getItem('directoryYear');
      return saved ? parseInt(saved, 10) : 2020;
  });
  const [yearInput, setYearInput] = useState(() => {
      const saved = localStorage.getItem('directoryYear');
      return saved ? saved : '2020';
  });

  useEffect(() => {
      localStorage.setItem('directoryYear', year.toString());
  }, [year]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/data/global?year=${year}`);
        
        // Response is { "CountryName": { ...data }, ... }
        const rawDataMap = response.data;
        
        // Match every country in the countries list to be in the data directory
        const enrichedData = countriesData.map(c => {
          const rowData = rawDataMap[c.iso3] || rawDataMap[c.name] || {};
          return {
            ...rowData,
            countryName: c.name,
            iso3: c.iso3,
            iso2: c.iso2,
            continent: c.continent || 'Unknown',
            year: rowData.year || year
          };
        });
        
        setData(enrichedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce the slider fetch slightly to avoid spamming the backend
    const timeoutId = setTimeout(() => fetchData(), 150);
    return () => clearTimeout(timeoutId);
  }, [year]);

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

  const activeDimensions = dimensions.filter(d => visibleColumns.includes(d.key));

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

  const togglePin = (iso3, e) => {
    e.stopPropagation();
    setPinnedCountries(prev => {
      const next = new Set(prev);
      if (next.has(iso3)) next.delete(iso3);
      else next.add(iso3);
      return next;
    });
  };

  const dimensionStats = React.useMemo(() => {
    const stats = {};
    activeDimensions.forEach(dim => {
      const values = data.map(r => r[dim.key]).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        stats[dim.key] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });
    return stats;
  }, [data, activeDimensions]);

  const getHeatmapColor = (val, dim) => {
    if (!heatmapMode || val === null || val === undefined || !dimensionStats[dim.key]) return undefined;
    const { min, max } = dimensionStats[dim.key];
    if (max === min) return undefined;
    
    let pct = (val - min) / (max - min);
    if (dim.invert) pct = 1 - pct;
    
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
    
    if (selectedContinent !== 'All') {
      filteredData = filteredData.filter(row => row.continent === selectedContinent);
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(row => 
        row.countryName.toLowerCase().includes(lowerSearch) || 
        row.iso3.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? -Infinity;
        const bVal = b[sortConfig.key] ?? -Infinity;
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredData;
  }, [data, sortConfig, searchTerm, selectedContinent]);

  const pinnedRows = sortedData.filter(r => pinnedCountries.has(r.iso3));
  const unpinnedRows = sortedData.filter(r => !pinnedCountries.has(r.iso3));
  const displayRows = [...pinnedRows, ...unpinnedRows];

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 inline opacity-40" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 inline text-primary" /> 
      : <ArrowDown size={14} className="ml-1 inline text-primary" />;
  };

  const exportCSV = () => {
    if (sortedData.length === 0) return;
    
    const headers = ['Country', 'ISO3', 'Continent', ...activeDimensions.map(d => d.label), 'Data Year'];
    const rows = sortedData.map(row => [
      `"${row.countryName}"`,
      row.iso3,
      row.continent,
      ...activeDimensions.map(d => row[d.key] !== null && row[d.key] !== undefined ? row[d.key] : ''),
      row.year
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `world_atlas_data_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-12 px-6 text-[#010104]">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Data Directory</h1>
            <p className="text-gray-600 max-w-2xl">
              Explore the data for all tracked indicators across countries for a specific year. Click on any column header to sort.
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
                  {dimensions.map(dim => (
                    <label key={dim.key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(dim.key)}
                        onChange={() => toggleColumn(dim.key)}
                        className="w-4 h-4 text-[#3A31D8] rounded border-gray-300 focus:ring-[#3A31D8] cursor-pointer"
                      />
                      <span className="text-sm font-medium text-[#010104]">{dim.label}</span>
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
          
          {/* Search and Continent */}
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Search Country</label>
              <input
                type="text"
                placeholder="Search by name or ISO code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#EBE9FC] bg-[#F9F8FF] focus:outline-none focus:ring-2 focus:ring-[#3A31D8]/50 text-[#010104] placeholder:text-gray-400 font-medium"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Continent</label>
              <div className="relative">
                <select
                  value={selectedContinent}
                  onChange={(e) => setSelectedContinent(e.target.value)}
                  className="w-full px-4 pr-10 py-2.5 rounded-xl border border-[#EBE9FC] bg-[#F9F8FF] focus:outline-none focus:ring-2 focus:ring-[#3A31D8]/50 text-[#010104] font-medium appearance-none cursor-pointer"
                >
                  {continentsList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ArrowDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
              </div>
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
                  <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 left-0 bg-[#F9F8FF] z-30 hover:z-50 shadow-[1px_1px_0_0_#EBE9FC] align-middle" onClick={() => handleSort('countryName')}>
                    Country {renderSortIcon('countryName')}
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 bg-[#F9F8FF] z-20 hover:z-50 shadow-[0_1px_0_0_#EBE9FC] align-middle" onClick={() => handleSort('iso3')}>
                    ISO {renderSortIcon('iso3')}
                  </th>
                  {activeDimensions.map((dim) => (
                    <th 
                      key={dim.key}
                      className="px-6 py-5 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap sticky top-0 bg-[#F9F8FF] z-20 hover:z-50 shadow-[0_1px_0_0_#EBE9FC] align-middle"
                      onClick={() => handleSort(dim.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        {dim.label} {renderSortIcon(dim.key)}
                        {dim.desc && (
                          <div className="group/tooltip relative flex items-center">
                            <Info size={14} className="text-gray-400 hover:text-[#3A31D8] transition-colors" />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#262626] text-white text-[13px] leading-relaxed p-3 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-xl font-medium font-sans normal-case tracking-normal whitespace-normal text-center">
                              {dim.desc}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#262626]"></div>
                            </div>
                          </div>
                        )}
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
                  const isPinned = pinnedCountries.has(row.iso3);
                  return (
                  <tr key={row.iso3} className={`transition-colors group ${isPinned ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-bold whitespace-nowrap sticky left-0 z-10 shadow-[1px_0_0_0_#EBE9FC] ${isPinned ? 'bg-[#FFFAF0] group-hover:bg-[#FFF4DF]' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3 w-max">
                        <button 
                          onClick={(e) => togglePin(row.iso3, e)}
                          className={`flex-shrink-0 focus:outline-none transition-colors ${isPinned ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'}`}
                          title={isPinned ? "Unpin country" : "Pin country to top"}
                        >
                          <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                        </button>
                        {row.iso2 ? (
                          <img 
                            src={`https://flagcdn.com/w20/${row.iso2.toLowerCase()}.png`} 
                            alt=""
                            className="w-5 h-auto rounded-[2px] shadow-sm border border-gray-100"
                          />
                        ) : (
                          <div className="w-5 h-[14px] bg-gray-200 rounded-[2px]"></div>
                        )}
                        <span 
                          className="cursor-pointer hover:text-[#3A31D8] transition-colors"
                          onClick={(e) => handleCopy(row.countryName, e)}
                          title="Click to copy"
                        >
                          {row.countryName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      <span 
                        className="cursor-pointer hover:text-[#3A31D8] transition-colors"
                        onClick={(e) => handleCopy(row.iso3, e)}
                        title="Click to copy"
                      >
                        {row.iso3}
                      </span>
                    </td>
                    {activeDimensions.map(dim => (
                      <td 
                        key={dim.key} 
                        className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap transition-colors"
                        style={{ backgroundColor: getHeatmapColor(row[dim.key], dim) }}
                      >
                        <span 
                          className={`cursor-pointer transition-colors hover:text-[#3A31D8] ${row[dim.key] == null ? 'text-gray-300 font-normal' : ''}`}
                          onClick={(e) => handleCopy(row[dim.key], e)}
                          title="Click to copy"
                        >
                          {row[dim.key] !== null && row[dim.key] !== undefined 
                            ? Number(row[dim.key]).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                            : 'N/A'}
                        </span>
                      </td>
                    ))}
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

export default DataDirectory;
