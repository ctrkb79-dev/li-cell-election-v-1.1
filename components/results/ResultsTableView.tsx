import React from 'react';
import { Trophy, Clock, AlertTriangle, CheckSquare, Square, Hash } from 'lucide-react';
import { CANDIDATES } from '../../candidates';

interface ResultsTableViewProps {
  items: any[];
  startIndex: number;
  filterParty: string;
  mandatoryParties: string[];
  loading: boolean;
  recentSeatNos: string[];
  isAdminMode: boolean;
  canDeclareWinner: boolean; // New Prop
  onToggleWinner: (seatNo: string, partyName: string, currentStatus: boolean, division: string, district: string) => void;
  onToggleSuspended: (seatNo: string, currentStatus: boolean) => void;
}

const ResultsTableView: React.FC<ResultsTableViewProps> = ({ 
  items, startIndex, filterParty, mandatoryParties, loading, recentSeatNos, isAdminMode, canDeclareWinner,
  onToggleWinner, onToggleSuspended 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-white uppercase bg-red-700">
            <tr>
              <th scope="col" className="px-4 py-3 border border-red-800 text-center w-16">ক্রমিক</th>
              <th scope="col" className="px-4 py-3 border border-red-800 text-center w-32">আসন নং</th>
              <th scope="col" className="px-4 py-3 border border-red-800">দল ও প্রার্থী</th>
              <th scope="col" className="px-4 py-3 border border-red-800 text-center">প্রাপ্ত ভোট</th>
              <th scope="col" className="px-4 py-3 border border-red-800 text-center">ফলাফল / সিদ্ধান্ত</th>
              <th scope="col" className="px-4 py-3 border border-red-800 text-center">মন্তব্য / সময়</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((seat, seatIdx) => {
                const isSuspended = !!seat.isSuspended;
                const rowClass = isSuspended ? 'bg-red-100 hover:bg-red-200 text-red-900' : 'bg-white hover:bg-gray-50 text-gray-800';
                
                // Use pre-calculated stats
                const { maxVotes } = seat.stats;

                // Determine parties to show
                const partiesToShow = [...mandatoryParties];
                seat.results.forEach((r: any) => {
                    if (!partiesToShow.includes(r.party)) {
                        partiesToShow.push(r.party);
                    }
                });

                let combinedResults = partiesToShow.map(partyName => {
                  const existing = seat.results.find((r: any) => r.party === partyName);
                  return {
                    party: partyName,
                    votes: existing ? existing.votes : 0,
                    candidate: existing?.candidate || CANDIDATES[seat.seatNo]?.[partyName] || '',
                    isDeclaredWinner: existing?.isDeclaredWinner || false,
                    hasEntry: !!existing
                  };
                });

                const isRecent = recentSeatNos.includes(seat.seatNo);
                
                if (filterParty) {
                  combinedResults = combinedResults.filter(r => r.party === filterParty);
                }

                if (combinedResults.length === 0) return null;

                return combinedResults.map((result, resultIdx) => {
                  const isVoteWinner = result.votes === maxVotes && result.votes > 0;
                  const isManualWinner = result.isDeclaredWinner;
                  
                  return (
                    <tr key={`${seat.seatNo}-${result.party}`} className={`${rowClass} border-b transition-colors`}>
                      <td className="px-4 py-3 border border-gray-300 text-center font-medium align-middle">
                        {(startIndex + seatIdx + 1).toLocaleString('bn-BD')}
                      </td>

                      {resultIdx === 0 && (
                        <td 
                          className={`px-4 py-3 border border-gray-300 text-center font-bold align-middle ${isSuspended ? 'bg-red-200/50' : 'bg-gray-50'}`}
                          rowSpan={combinedResults.length}
                        >
                          <div className="text-lg text-gray-900">{seat.seatNo}</div>
                          
                          {/* Seat Index Badge */}
                          {seat.seatIndex && (
                            <div className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-0.5 mt-1 font-mono font-bold shadow-sm border ${isSuspended ? 'bg-white/60 border-red-200 text-red-800' : 'bg-white border-gray-300 text-gray-600'}`}>
                              <Hash size={10} className="opacity-50" />
                              {seat.seatIndex}
                            </div>
                          )}
                          
                          <div className={`text-xs font-normal mt-1 leading-tight ${isSuspended ? 'text-red-800' : 'text-gray-500'}`}>
                            {seat.areaDescription || seat.district}
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3 border border-gray-300 font-medium align-middle">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold">{result.party}</div>
                                {result.candidate && (
                                  <div className={`text-xs mt-0.5 ${isSuspended ? 'text-red-700' : 'text-gray-600'}`}>{result.candidate}</div>
                                )}
                            </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border border-gray-300 text-center font-mono align-middle">
                        {result.votes > 0 ? result.votes.toLocaleString('bn-BD') : ''}
                      </td>
                      
                      {/* Decision Column: Winner Toggle + Suspend Toggle + Status */}
                      <td className="px-4 py-3 border border-gray-300 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-2">
                            
                            {/* Controls Row */}
                            {isAdminMode && (
                                <div className="flex items-center gap-3 bg-gray-100/50 px-2 py-1 rounded-full border border-gray-200">
                                    {/* Winner Toggle (Green) - Only if allowed */}
                                    {canDeclareWinner && (
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onToggleWinner(seat.seatNo, result.party, result.isDeclaredWinner, seat.division, seat.district);
                                          }}
                                          className={`transition-colors ${result.isDeclaredWinner ? 'text-green-600' : 'text-gray-300 hover:text-green-500'}`}
                                          title={result.isDeclaredWinner ? "বিজয় বাতিল করুন" : "বিজয়ী ঘোষণা করুন"}
                                          disabled={isSuspended}
                                      >
                                          {result.isDeclaredWinner ? <CheckSquare size={20} /> : <Square size={20} />}
                                      </button>
                                    )}

                                    {/* Suspend Toggle (Red) - Only on first row */}
                                    {resultIdx === 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleSuspended(seat.seatNo, isSuspended);
                                            }}
                                            className={`transition-colors ${isSuspended ? 'text-red-600' : 'text-gray-300 hover:text-red-500'}`}
                                            title={isSuspended ? "স্থগিতাদেশ প্রত্যাহার করুন" : "আসন স্থগিত করুন"}
                                        >
                                            {isSuspended ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Status Display */}
                            <div className="flex flex-col items-center">
                                {(isVoteWinner || isManualWinner) && !isSuspended && (
                                    <span className="inline-flex items-center justify-center gap-1.5 text-green-700 bg-green-100 px-3 py-0.5 rounded-full text-xs font-bold border border-green-200 whitespace-nowrap shadow-sm">
                                        <Trophy size={12} className="shrink-0" />
                                        <span>বিজয়ী</span>
                                    </span>
                                )}
                                {isSuspended && resultIdx === 0 && (
                                    <span className="inline-flex items-center justify-center gap-1 text-red-600 bg-red-100 px-3 py-0.5 rounded-full text-xs font-bold border border-red-200 whitespace-nowrap shadow-sm mt-1 animate-pulse">
                                        <AlertTriangle size={12} />
                                        <span>স্থগিত</span>
                                    </span>
                                )}
                            </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-300 align-middle text-center w-32">
                        {resultIdx === 0 && (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {isRecent && !isSuspended && (
                              <span className="inline-block text-red-600 text-[10px] font-bold border border-red-200 bg-red-50 px-2 py-0.5 rounded animate-pulse whitespace-nowrap">
                                নতুন আপডেট
                              </span>
                            )}
                            {seat.updatedAt && (
                              <span className={`text-[11px] font-mono flex items-center gap-1 px-2 py-0.5 rounded border ${isSuspended ? 'bg-red-200 border-red-300 text-red-800' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                  <Clock size={10} />
                                  {new Date(seat.updatedAt.seconds * 1000).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                });
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ফলাফল পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTableView;