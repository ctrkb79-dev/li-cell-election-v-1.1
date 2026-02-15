
import React from 'react';
import { Database, RotateCcw, Loader2 } from 'lucide-react';

interface EntryHeaderProps {
  totalVotes: number;
  isInitializing: boolean;
  onInitialize: () => void;
  onReset: () => void;
  hasSeatSelected: boolean;
}

const EntryHeader: React.FC<EntryHeaderProps> = ({ 
  totalVotes, isInitializing, onInitialize, onReset, hasSeatSelected 
}) => {
  return (
    <div className="bg-green-600 px-6 py-4 rounded-t-xl flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-white">
          তথ্য এন্ট্রি ফরম
        </h2>
        <p className="text-green-100 text-sm mt-1">
          আসন ভিত্তিক তথ্য ও ফলাফল যুক্ত করুন
        </p>
      </div>
      <div className="flex items-center gap-3">
        {hasSeatSelected && (
          <div className="bg-green-700 p-2 rounded-lg text-white text-center min-w-[100px]">
            <span className="text-xs block opacity-80">বর্তমান ভোট</span>
            <span className="font-bold text-lg">{totalVotes.toLocaleString('bn-BD')}</span>
          </div>
        )}
        
        <button
          type="button"
          onClick={onInitialize}
          disabled={isInitializing}
          className="bg-green-800 hover:bg-green-900 text-white p-2 px-3 rounded-lg transition-all shadow-sm border border-green-700 text-xs font-bold flex items-center gap-2"
          title="সকল স্ট্যাটিক ডাটা ডাটাবেসে আপলোড করুন"
        >
          {isInitializing ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
          DB Init
        </button>

        <button
          type="button"
          onClick={onReset}
          className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-lg transition-all shadow-sm border border-green-600"
          title="ফর্ম রিসেট করুন"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default EntryHeader;
