import React from 'react';
import DashboardSeatCard from './list/DashboardSeatCard';

interface SeatInfoItem {
  seatNo: string;
  division: string;
  district: string;
  seatIndex: number;
  areas: string[];
  winner?: {
    party: string;
    votes: number;
  };
  isSuspended?: boolean;
}

interface DashboardSeatListProps {
  items: SeatInfoItem[];
  onSelect: (seatNo: string) => void;
  onResetFilters: () => void;
}

const DashboardSeatList: React.FC<DashboardSeatListProps> = ({ items, onSelect, onResetFilters }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="text-gray-400 mb-2">কোনো ফলাফল পাওয়া যায়নি</div>
        <button onClick={onResetFilters} className="text-teal-600 font-medium hover:underline">ফিল্টার রিসেট করুন</button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 fade-in">
      <div className="flex items-center justify-between text-sm text-gray-500 px-2 mb-4">
        <span>প্রদর্শিত: <strong className="text-gray-800">{items.length}</strong> টি আসন</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {items.map((item) => (
            <DashboardSeatCard 
                key={item.seatNo} 
                item={item} 
                onSelect={onSelect} 
            />
        ))}
      </div>
    </div>
  );
};

export default DashboardSeatList;