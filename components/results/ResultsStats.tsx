import React from 'react';
import { Activity } from 'lucide-react';
import { PARTY_COLORS } from '../../constants';

interface ResultsStatsProps {
  stats: {
    sortedStats: { party: string; wins: number }[];
    totalDeclared: number;
    totalCount: number;
  };
}

const ResultsStats: React.FC<ResultsStatsProps> = ({ stats }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-red-600" />
            নির্বাচনী ফলাফল ড্যাশবোর্ড
          </h1>
          <p className="text-gray-500 text-sm mt-1">লাইভ আপডেট ও বিস্তারিত পরিসংখ্যান</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div className="text-sm text-gray-500 font-medium">মোট আসন</div>
          <div className="text-3xl font-bold text-gray-800">
            {stats.totalDeclared} <span className="text-lg text-gray-400">/ {stats.totalCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.sortedStats.length > 0 ? (
          stats.sortedStats.map((stat, idx) => {
            const color = PARTY_COLORS[stat.party] || PARTY_COLORS['default'];
            return (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border-t-4 shadow-sm" style={{ borderColor: color }}>
                <div className="text-xs font-bold text-gray-500 uppercase truncate" title={stat.party}>{stat.party}</div>
                <div className="text-2xl font-bold text-gray-800 mt-1">{stat.wins}</div>
                <div className="text-[10px] text-gray-400">বিজয়</div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center text-gray-400 py-4 italic">কোনো ফলাফল ঘোষিত হয়নি</div>
        )}
      </div>
    </div>
  );
};

export default ResultsStats;