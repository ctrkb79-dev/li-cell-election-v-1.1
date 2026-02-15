import React from 'react';
import { Vote, MapPin } from 'lucide-react';

interface SummaryListProps {
  summaryStats: any[];
  onNavigateToMap?: (party: string) => void;
  loading: boolean;
}

const SummaryList: React.FC<SummaryListProps> = ({ summaryStats, onNavigateToMap, loading }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Vote className="text-green-600" size={20} />
          দলের অবস্থান ও ফলাফল সারসংক্ষেপ
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-white uppercase bg-gray-800">
            <tr>
              <th className="px-6 py-3 border-r border-gray-700 text-center w-20">অবস্থান</th>
              <th className="px-6 py-3 border-r border-gray-700">দলের নাম</th>
              <th className="px-6 py-3 border-r border-gray-700 text-center">বিজয়ী আসন</th>
              <th className="px-6 py-3 border-r border-gray-700 text-center">পরাজিত</th>
              <th className="px-6 py-3 text-right">মোট প্রাপ্ত ভোট</th>
            </tr>
          </thead>
          <tbody>
            {summaryStats.filter(s => s.participations > 0).length > 0 ? (
              summaryStats
                .filter(s => s.participations > 0)
                .map((stat, idx) => {
                const rank = (idx + 1).toLocaleString('bn-BD');
                const isTop = idx === 0 && stat.wins > 0;
                const losses = stat.participations - stat.wins;

                return (
                  <tr key={stat.party} className={`
                    border-b hover:bg-gray-50 transition-colors
                    ${isTop ? 'bg-yellow-50' : 'bg-white'}
                  `}>
                    <td className="px-6 py-3 text-center border-r border-gray-200 font-bold text-gray-500">
                      #{rank}
                    </td>
                    <td className="px-6 py-3 border-r border-gray-200 font-bold text-gray-800 text-lg">
                      {stat.party}
                    </td>
                    <td className="px-6 py-3 text-center border-r border-gray-200">
                      <button
                        onClick={() => onNavigateToMap && stat.wins > 0 && onNavigateToMap(stat.party)}
                        disabled={stat.wins === 0}
                        className={`
                          inline-flex items-center px-3 py-1 rounded-full text-sm font-bold transition-transform active:scale-95
                          ${stat.wins > 0 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer shadow-sm border border-green-200' 
                            : 'bg-gray-100 text-gray-500 cursor-default'}
                        `}
                        title={stat.wins > 0 ? "ম্যাপে বিজয়ী আসনগুলো দেখুন" : ""}
                      >
                        {stat.wins > 0 && <MapPin size={12} className="mr-1" />}
                        {stat.wins.toLocaleString('bn-BD')} টি
                      </button>
                    </td>
                    <td className="px-6 py-3 text-center border-r border-gray-200">
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
                        ${losses > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}
                      `}>
                        {losses.toLocaleString('bn-BD')} টি
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-gray-700 font-medium">
                      {stat.totalVotes.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ফলাফল পাওয়া যায়নি।"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryList;