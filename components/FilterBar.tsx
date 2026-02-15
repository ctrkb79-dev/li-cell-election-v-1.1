import React, { useMemo, useState, useEffect } from 'react';
import { Filter, RotateCcw, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { LOCATION_DATA, SEAT_DATA, PARTIES } from '../constants';

interface FilterBarProps {
  division: string;
  setDivision: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  seat: string;
  setSeat: (val: string) => void;
  party?: string;
  setParty?: (val: string) => void;
  onReset: () => void;
  title?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  showParty?: boolean;
  // New Search Props
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  // Dynamic Party Options
  partyOptions?: string[]; 
}

const FilterBar: React.FC<FilterBarProps> = ({
  division,
  setDivision,
  district,
  setDistrict,
  seat,
  setSeat,
  party,
  setParty,
  onReset,
  title = "ফিল্টার অপশন",
  rightContent,
  className = "",
  showParty = true,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "খুঁজুন...",
  partyOptions
}) => {
  
  // Persistence Logic
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('filter_bar_expanded');
        return saved === 'true'; 
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    try {
      // Use String() instead of JSON.stringify to avoid circular structure errors
      // if state accidentally holds a complex object
      const valueToSave = isExpanded === true;
      localStorage.setItem('filter_bar_expanded', String(valueToSave));
    } catch (e) {
      console.warn("Failed to save filter bar state");
    }
  }, [isExpanded]);

  // Derived Options Logic
  const districts = useMemo(() => {
    if (!division) return [];
    return Object.keys(LOCATION_DATA[division] || {});
  }, [division]);

  const seats = useMemo(() => {
    if (!district) return [];
    return SEAT_DATA[district] || [];
  }, [district]);

  // Handle cascading changes
  const handleDivisionChange = (val: string) => {
    setDivision(val);
    setDistrict('');
    setSeat('');
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setSeat('');
  };

  const hasActiveFilter = division || district || seat || (showParty && party) || searchTerm;

  // Use passed partyOptions or fallback to default PARTIES
  const currentPartyOptions = partyOptions && partyOptions.length > 0 ? partyOptions : PARTIES;

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      
      {/* Toggle Header */}
      <div 
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-gray-700 font-bold text-lg">
          <div className={`p-2 rounded-xl text-indigo-600 shadow-sm transition-all ${isExpanded ? 'bg-indigo-100' : 'bg-white'}`}>
            <Filter size={20} />
          </div>
          <span>ফিল্টার করুন</span>
          {/* Show active filter count badge if collapsed and filters active */}
          {!isExpanded && hasActiveFilter && (
             <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </div>
        <div className="text-gray-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-5 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
            
            {/* Top Row: Search & Reset */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5 pb-4 border-b border-gray-100">
                
                {/* Search Bar */}
                {onSearchChange && (
                <div className="relative w-full max-w-md group">
                    <input 
                        type="text" 
                        value={searchTerm || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 placeholder:text-gray-400 text-gray-700 shadow-inner group-hover:border-gray-300"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" size={18} />
                    
                    {searchTerm && (
                        <button 
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110"
                            title="মুছুন"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                )}
                
                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                {rightContent}
                
                {hasActiveFilter && (
                    <button
                    onClick={onReset}
                    className="group flex items-center gap-2 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-4 py-2.5 rounded-full transition-all duration-300 border border-red-200 hover:border-red-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    title="সব ফিল্টার রিসেট করুন"
                    >
                    <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                    রিসেট
                    </button>
                )}
                </div>
            </div>

            {/* Dropdowns Row */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${showParty ? '4' : '3'} gap-4`}>
                <div className="space-y-1.5 group">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-hover:text-indigo-500 transition-colors">বিভাগ</label>
                    <SearchableSelect
                    options={Object.keys(LOCATION_DATA)}
                    value={division}
                    onChange={handleDivisionChange}
                    placeholder="সকল বিভাগ"
                    className="shadow-sm hover:shadow transition-shadow"
                    />
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-hover:text-indigo-500 transition-colors">জেলা</label>
                    <SearchableSelect
                    options={districts}
                    value={district}
                    onChange={handleDistrictChange}
                    disabled={!division}
                    placeholder="সকল জেলা"
                    className="shadow-sm hover:shadow transition-shadow"
                    />
                </div>

                <div className="space-y-1.5 group">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-hover:text-indigo-500 transition-colors">আসন</label>
                    <SearchableSelect
                    options={seats}
                    value={seat}
                    onChange={setSeat}
                    disabled={!district}
                    placeholder="সকল আসন"
                    className="shadow-sm hover:shadow transition-shadow"
                    />
                </div>

                {showParty && setParty && (
                <div className="space-y-1.5 group">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-hover:text-indigo-500 transition-colors">দল</label>
                    <SearchableSelect
                        options={currentPartyOptions}
                        value={party || ''}
                        onChange={setParty}
                        placeholder="সকল দল"
                        className="shadow-sm hover:shadow transition-shadow"
                    />
                </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;