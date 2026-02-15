import React from 'react';
import { LayoutDashboard, Activity, Info, BarChart3 } from 'lucide-react';

interface DashboardHeaderProps {
  activeTab: 'results' | 'charts' | 'info';
  setActiveTab: (tab: 'results' | 'charts' | 'info') => void;
  showDetailPage: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeTab, setActiveTab, showDetailPage }) => {
  if (showDetailPage) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <LayoutDashboard className="text-indigo-600" size={32} />
          ইলেকশন ড্যাশবোর্ড ২০২৬
        </h1>
        <p className="text-gray-500 font-medium mt-1 ml-1">এক নজরে নির্বাচনের সর্বশেষ ফলাফল ও পরিসংখ্যান</p>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'results' 
            ? 'bg-white text-indigo-700 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={16} />
          ফলাফল
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'charts' 
            ? 'bg-white text-purple-700 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 size={16} />
          গ্রাফ ও চার্ট
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'info' 
            ? 'bg-white text-teal-700 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Info size={16} />
          তথ্য
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
