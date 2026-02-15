import React from 'react';
import { Trophy, AlertTriangle, Hash } from 'lucide-react';

interface WinnersListProps {
  items: any[];
  startIndex: number;
  loading: boolean;
}

const WinnersList: React.FC<WinnersListProps> = ({ 
  items, startIndex, loading 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-white uppercase bg-yellow-700 whitespace-nowrap">
            <tr>
              <th scope="col" className="px-6 py-3 border border-yellow-800 text-center">ক্রমিক নং</th>
              <th scope="col" className="px-6 py-3 border border-yellow-800 text-center">আসন নং</th>
              <th scope="col" className="px-6 py-3 border border-yellow-800">দল</th>
              <th scope="col" className="px-6 py-3 border border-yellow-800 text-center">প্রাপ্ত ভোট</th>
              <th scope="col" className="px-6 py-3 border border-yellow-800 text-center">ফলাফল / অবস্থা</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap">
            {items.length > 0 ? (
              items.map((winner, idx) => {
                const isSuspended = winner.isSuspended;
                // Reddish background for suspended
                const rowClass = isSuspended 
                    ? 'bg-red-50 hover:bg-red-100 text-gray-800 border-l-4 border-l-red-500' 
                    : 'bg-white hover:bg-yellow-50 text-gray-800 border-l-4 border-l-transparent';

                return (
                  <tr key={`${winner.seatNo}-${winner.party}`} className={`${rowClass} border-b transition-colors`}>
                    <td className="px-6 py-3 border border-gray-300 text-center font-medium align-middle">
                      {(startIndex + idx + 1).toLocaleString('bn-BD')}
                    </td>
                    <td className="px-6 py-3 border border-gray-300 text-center font-bold align-middle">
                      <div className="text-lg">{winner.seatNo}</div>
                      
                      {winner.seatIndex && (
                        <div className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5 font-mono border shadow-sm ${isSuspended ? 'bg-white/60 border-red-200 text-red-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                          <Hash size={10} className="opacity-50" />
                          {winner.seatIndex}
                        </div>
                      )}
                      
                      <div className={`text-[10px] font-normal mt-1 ${isSuspended ? 'text-red-600' : 'text-gray-500'}`}>
                         {winner.areaDescription || winner.district}
                      </div>
                    </td>
                    <td className="px-6 py-3 border border-gray-300 font-medium align-middle">
                      <div className="font-bold">{winner.party}</div>
                      {winner.candidate && (
                        <div className={`text-xs ${isSuspended ? 'text-red-700' : 'text-gray-500'}`}>{winner.candidate}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 border border-gray-300 text-center font-mono align-middle">
                      {winner.votes > 0 ? winner.votes.toLocaleString('bn-BD') : '-'}
                    </td>
                    <td className="px-6 py-3 border border-gray-300 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                          {isSuspended ? (
                              <span className="text-red-600 font-bold text-xs flex items-center gap-1 animate-pulse border border-red-200 bg-red-100 px-3 py-1.5 rounded-full shadow-sm">
                                  <AlertTriangle size={14} />
                                  নির্বাচন স্থগিত
                              </span>
                          ) : (
                              <span className="inline-flex items-center justify-center gap-1.5 text-green-700 bg-green-100 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                                <Trophy size={14} className="shrink-0" />
                                <span>ঘোষিত বিজয়ী</span>
                              </span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ঘোষিত বিজয়ী পাওয়া যায়নি।"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WinnersList;