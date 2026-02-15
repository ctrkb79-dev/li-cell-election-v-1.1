
import React from 'react';
import { Search, X, LayoutGrid, Table, Image as ImageIcon, Download, Trash2, Lock, Unlock } from 'lucide-react';

interface ResultsActionsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  onDownloadImage: () => void;
  onDownloadReport: () => void;
  onDeleteAll?: () => void;
  hasData: boolean;
  isAdminMode?: boolean;
  setIsAdminMode?: (val: boolean) => void;
}

const ResultsActions: React.FC<ResultsActionsProps> = ({ 
  searchTerm, setSearchTerm, viewMode, setViewMode, 
  onDownloadImage, onDownloadReport, onDeleteAll, hasData,
  isAdminMode, setIsAdminMode
}) => {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="আসন, জেলা বা প্রার্থী খুঁজুন..." 
          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 transition-all placeholder:text-gray-400 text-gray-700"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 items-center flex-wrap justify-end w-full md:w-auto">
        
        {/* Admin Toggle */}
        {setIsAdminMode && (
            <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isAdminMode 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}
                title={isAdminMode ? "অ্যাডমিন মোড চালু (এডিট করা যাবে)" : "পাবলিক মোড (শুধুমাত্র দেখা যাবে)"}
            >
                {isAdminMode ? <Unlock size={14} /> : <Lock size={14} />}
                {isAdminMode ? "Admin" : "Public"}
            </button>
        )}

        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0 mr-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-medium ${viewMode === 'cards' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            title="কার্ড ভিউ"
          >
            <LayoutGrid size={14} />
            কার্ড
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-medium ${viewMode === 'table' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
            title="টেবিল ভিউ"
          >
            <Table size={14} />
            টেবিল
          </button>
        </div>

        <button onClick={onDownloadImage} className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 font-medium transition-colors">
          <ImageIcon size={14} /> স্ন্যাপশট
        </button>
        <button
          onClick={onDownloadReport}
          className="flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Download size={14} /> রিপোর্ট
        </button>
        {hasData && onDeleteAll && isAdminMode && (
          <button
            onClick={onDeleteAll}
            className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-red-200"
          >
            <Trash2 size={14} /> সব মুছুন
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsActions;
