import React from 'react';
import { Trophy, Search, X, FileText, RotateCcw } from 'lucide-react';

interface WinnersActionsProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onDownloadReport: () => void;
  onResetFilters: () => void;
  hasData: boolean;
  isFiltered: boolean;
}

const WinnersActions: React.FC<WinnersActionsProps> = ({ 
  searchTerm, setSearchTerm, onDownloadReport, onResetFilters, hasData, isFiltered 
}) => {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
      <div className="flex items-center gap-2 text-yellow-700 font-semibold w-full sm:w-auto">
        <Trophy size={18} />
        বিজয়ী তালিকা ফিল্টার
      </div>
      
      <div className="flex gap-2 items-center flex-wrap w-full sm:w-auto justify-end">
        {/* Search Bar */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="খুঁজুন..."
            className="pl-7 pr-6 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none w-full sm:w-40 transition-all text-gray-700 bg-gray-50"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {hasData && (
          <button
            onClick={onDownloadReport}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all border border-blue-200 hover:border-blue-600"
          >
            <FileText size={12} />
            নোটপ্যাড ডাউনলোড
          </button>
        )}

        {(isFiltered || searchTerm) && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-white hover:bg-gray-600 px-3 py-1.5 rounded-full transition-all border border-gray-200 hover:border-gray-600"
          >
            <RotateCcw size={12} />
            রিসেট
          </button>
        )}
      </div>
    </div>
  );
};

export default WinnersActions;