import React, { useState } from 'react';
import { MapPin, Trophy, ArrowLeft } from 'lucide-react';
import DashboardAreaTable from './results/DashboardAreaTable';
import DashboardPartyTable from './results/DashboardPartyTable';

interface DrillDownRow {
  name: string;
  type: 'division' | 'district' | 'seat';
  total: number;
  declared: number;
  leader: string;
  seatIndex?: number;
}

interface PartyTableRow {
  name: string;
  wins: number;
  votes: number;
}

interface DashboardDrillDownProps {
  data: DrillDownRow[];
  partyData?: PartyTableRow[];
  onRowClick: (row: DrillDownRow) => void;
  title: string;
  isDetailed: boolean;
  onBack?: () => void;
}

const DashboardDrillDown: React.FC<DashboardDrillDownProps> = ({ data, partyData = [], onRowClick, title, isDetailed, onBack }) => {
  const [activeTab, setActiveTab] = useState<'area' | 'party'>('area');

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            {onBack && activeTab === 'area' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }}
                    className="p-1.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all shadow-sm group"
                    title="ফিরে যান"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
            )}
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                {activeTab === 'area' ? <MapPin size={20} className="text-indigo-600" /> : <Trophy size={20} className="text-indigo-600" />}
                {activeTab === 'area' ? title : 'দলভিত্তিক ফলাফল ও অবস্থান'}
            </h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
                onClick={() => setActiveTab('area')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'area' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                এলাকা ভিত্তিক
            </button>
            <button
                onClick={() => setActiveTab('party')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'party' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                দল ভিত্তিক
            </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="overflow-x-auto">
        {activeTab === 'area' ? (
            <DashboardAreaTable 
                data={data} 
                onRowClick={onRowClick} 
                isDetailed={isDetailed} 
            />
        ) : (
            <DashboardPartyTable partyData={partyData} />
        )}
      </div>
    </div>
  );
};

export default DashboardDrillDown;
