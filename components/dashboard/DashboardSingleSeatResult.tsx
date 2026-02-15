
import React from 'react';
import { ArrowLeft, Activity, Vote, Trophy, Radio } from 'lucide-react';
import { PARTY_COLORS } from '../../constants';

interface BarDataItem {
  name: string;
  votes: number;
  isDeclaredWinner?: boolean;
}

interface SingleSeatStats {
  seatNo?: string;
  totalVotesCast: number;
  maxVotes: number;
  barData: BarDataItem[];
}

interface DashboardSingleSeatResultProps {
  stats: SingleSeatStats;
  onBack: () => void;
}

const DashboardSingleSeatResult: React.FC<DashboardSingleSeatResultProps> = ({ stats, onBack }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      {/* Specific Header for Single Seat */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="ফিরে যান"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-red-600" />
              {stats.seatNo} <span className="text-gray-400 font-normal text-lg md:text-xl">ফলাফল</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1 ml-1">লাইভ আপডেট ও বিস্তারিত পরিসংখ্যান</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 bg-violet-50 px-5 py-3 rounded-xl border border-violet-100 text-center">
          <div className="text-xs text-violet-600 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Vote size={14} /> মোট আসন ভোট
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalVotesCast.toLocaleString('bn-BD')}</div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.barData.length > 0 ? (
          stats.barData.map((item, idx) => {
            const color = PARTY_COLORS[item.name] || PARTY_COLORS['default'];
            // Winner Logic: Either declared or has max votes
            const isLeading = item.votes === stats.maxVotes && item.votes > 0;
            const isDeclared = item.isDeclaredWinner;
            const statusText = isDeclared ? "বিজয়" : (isLeading ? "এগিয়ে" : "");

            return (
              <div key={idx} className="bg-white rounded-lg p-4 border-t-[5px] shadow-sm hover:shadow-md transition-shadow border border-gray-100" style={{ borderColor: color }}>
                <div className="text-xs font-bold text-gray-500 uppercase truncate mb-2" title={item.name}>
                  {item.name}
                </div>
                <div className="text-2xl font-bold text-gray-800 font-mono">
                  {item.votes.toLocaleString('bn-BD')}
                </div>
                {statusText && (
                  <div className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full w-fit ${isDeclared ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isDeclared && <Trophy size={10} className="inline mr-1" />}
                    {statusText}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            এখনো কোনো ফলাফল পাওয়া যায়নি
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSingleSeatResult;
