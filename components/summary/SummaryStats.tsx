import React from 'react';

interface SummaryStatsProps {
  summaryStats: any[];
  topWinner: any;
  loading: boolean;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ summaryStats, topWinner, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Top Winners Card - Single Champion */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg flex flex-col justify-center min-h-[140px]">
         <div className="text-green-100 text-sm font-medium mb-3 border-b border-green-500 pb-1">ফলাফল (বিজয়ী দল)</div>
         
         {topWinner ? (
            <div className="flex flex-col gap-1">
              <div className="text-3xl font-bold tracking-tight">
                {topWinner.party}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white text-green-700 font-bold px-3 py-1 rounded text-lg shadow-sm">
                  {topWinner.wins.toLocaleString('bn-BD')} <span className="text-sm font-normal">আসন</span>
                </span>
              </div>
            </div>
         ) : (
           <div className="text-center opacity-70 italic text-sm py-4">
             {loading ? "লোডিং..." : "এখনও কোনো বিজয়ী নেই"}
           </div>
         )}
         
         {summaryStats.length > 1 && topWinner && (
           <div className="text-xs text-green-200 mt-auto pt-4 flex items-center gap-1">
             <span className="opacity-75">+ আরও {summaryStats.filter(s => s.wins > 0 && s.party !== topWinner.party).length.toLocaleString('bn-BD')} টি দল আসন পেয়েছে</span>
           </div>
         )}
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg min-h-[140px]">
         <div className="text-blue-100 text-sm font-medium mb-1">মোট প্রদত্ত ভোট</div>
         <div className="text-3xl font-bold mt-2">
           {summaryStats.reduce((sum, s) => sum + s.totalVotes, 0).toLocaleString('bn-BD')}
         </div>
         <div className="text-sm opacity-80 mt-2">সকল দলের যোগফল</div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg min-h-[140px]">
         <div className="text-purple-100 text-sm font-medium mb-1">অংশগ্রহণকারী দল</div>
         <div className="text-3xl font-bold mt-2">
           {summaryStats.filter(s => s.participations > 0).length.toLocaleString('bn-BD')}
         </div>
         <div className="text-sm opacity-80 mt-2">যাদের প্রাপ্ত ভোট &gt; ০</div>
      </div>
    </div>
  );
};

export default SummaryStats;