import React from 'react';
import { Users, AlertTriangle, Clock, Radio } from 'lucide-react';
import { PARTY_COLORS } from '../../constants';

interface DashboardStatsProps {
  winningStats: Record<string, number>;
  suspendedCount: number;
  pendingCount: number;
  leadingStats: Record<string, number>;
  showLeading: boolean;
  setShowLeading: (val: boolean) => void;
  onCardClick: (type: 'party' | 'suspended' | 'pending', value?: string) => void;
  activeFilter: string; // To highlight selected card
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
    winningStats = {}, 
    suspendedCount = 0, 
    pendingCount = 0, 
    leadingStats = {}, 
    showLeading, setShowLeading, onCardClick, activeFilter
}) => {
  
  const priorityParties = ['বিএনপি', 'জামায়াতে ইসলামী', 'এনসিপি', 'স্বতন্ত্র'];
  
  const winningParties = Object.entries(winningStats || {})
    .sort(([partyA, countA], [partyB, countB]) => {
        const idxA = priorityParties.indexOf(partyA);
        const idxB = priorityParties.indexOf(partyB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return Number(countB) - Number(countA);
    });

  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
        {/* Dynamic Party Winning Stats */}
        {winningParties.map(([party, count]) => {
            const color = PARTY_COLORS[party] || '#6b7280';
            const isActive = activeFilter === party;
            
            return (
            <div 
                key={party} 
                onClick={() => onCardClick('party', party)}
                className={`rounded-lg p-2 text-white shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:scale-105 transition-all duration-200 min-h-[65px] cursor-pointer
                    ${isActive ? 'ring-2 ring-offset-2 ring-gray-500 scale-105' : 'hover:shadow-md'}
                `}
                style={{ backgroundColor: color }}
                title={`${party}-এর ফলাফল দেখতে ক্লিক করুন`}
            >
                <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Users size={24} />
                </div>
                <h3 className="text-[10px] font-bold opacity-90 border-b border-white/30 pb-0.5 mb-0.5 w-full text-center truncate px-1">{party}</h3>
                <div className="text-xl font-bold leading-none">{Number(count).toLocaleString('bn-BD')}</div>
                <div className="text-[9px] opacity-80">টি আসন</div>
                {isActive && <div className="absolute inset-0 bg-black/10 pointer-events-none" />}
            </div>
            );
        })}

        {/* Suspended Card (Red) */}
        <div 
            onClick={() => onCardClick('suspended')}
            className={`bg-red-600 rounded-lg p-2 text-white shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[65px] hover:scale-105 transition-all duration-200 cursor-pointer
                ${activeFilter === 'suspended' ? 'ring-2 ring-offset-2 ring-red-600 scale-105' : 'hover:shadow-md'}
            `}
            title="স্থগিত আসনগুলো দেখতে ক্লিক করুন"
        >
            <div className="absolute top-0 right-0 p-1 opacity-20">
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-[10px] font-bold opacity-90 border-b border-white/30 pb-0.5 mb-0.5 w-full text-center">স্থগিত</h3>
            <div className="text-xl font-bold leading-none">{suspendedCount.toLocaleString('bn-BD')}</div>
            <div className="text-[9px] opacity-80">টি আসন</div>
        </div>

        {/* Pending/Remaining Card (Red - Clickable) */}
        <div 
            onClick={() => {
                setShowLeading(!showLeading);
                onCardClick('pending');
            }}
            className={`bg-red-700 rounded-lg p-2 text-white shadow-sm flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-red-800 transition-all active:scale-95 border border-red-500 hover:border-red-400 min-h-[65px]
                 ${activeFilter === 'pending' ? 'ring-2 ring-offset-2 ring-red-700 scale-105' : 'hover:shadow-md'}
            `}
            title="বাকি আসনগুলো দেখতে ক্লিক করুন"
        >
            <div className="absolute top-0 right-0 p-1 opacity-20">
                <Clock size={24} />
            </div>
            <h3 className="text-[10px] font-bold opacity-90 border-b border-white/30 pb-0.5 mb-0.5 w-full text-center flex items-center justify-center gap-1">
                বাকি {showLeading ? <Radio size={8} className="animate-pulse" /> : null}
            </h3>
            <div className="text-xl font-bold leading-none">{pendingCount.toLocaleString('bn-BD')}</div>
            <div className="text-[9px] opacity-80">ফলাফল</div>
        </div>
        </div>

        {/* Leading Stats Section (Visible only when 'Remaining' is clicked) */}
        {showLeading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Radio size={14} className="animate-pulse" />
                    ঘোষণা বাকি আসনগুলোতে এগিয়ে আছে
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(leadingStats || {}).map(([party, count]) => {
                        if (count === 0) return null;
                        const color = PARTY_COLORS[party] || '#6b7280';

                        return (
                            <div key={`leading-${party}`} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: color }}></div>
                                <div>
                                    <div className="text-xs text-gray-500 font-bold">{party}</div>
                                    <div className="text-sm font-bold text-gray-800">
                                        {Number(count).toLocaleString('bn-BD')} <span className="text-[10px] font-normal text-gray-400">এগিয়ে</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {Object.values(leadingStats || {}).every(v => v === 0) && (
                        <div className="col-span-full text-center text-xs text-gray-400 italic py-2">
                            কোনো দল এগিয়ে নেই বা তথ্য পাওয়া যায়নি
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default DashboardStats;