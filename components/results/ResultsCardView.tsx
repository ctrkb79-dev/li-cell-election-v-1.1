import React from 'react';
import { Clock, Trophy, Filter, AlertTriangle, PauseCircle, PlayCircle, Hash } from 'lucide-react';
import { PARTY_COLORS } from '../../constants';
import { CANDIDATES } from '../../candidates';

interface ResultsCardViewProps {
  items: any[];
  filterParty: string;
  recentSeatNos: string[];
  isAdminMode: boolean;
  canDeclareWinner: boolean; // New Prop
  onToggleWinner: (seatNo: string, party: string, status: boolean, division: string, district: string) => void;
  onToggleSuspended: (seatNo: string, currentStatus: boolean) => void;
}

const ResultsCardView: React.FC<ResultsCardViewProps> = ({ 
  items, filterParty, recentSeatNos, isAdminMode, canDeclareWinner,
  onToggleWinner, onToggleSuspended 
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <Filter className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">কোনো ফলাফল পাওয়া যায়নি</h3>
        <p className="text-gray-500">অন্য ফিল্টার ব্যবহার করে চেষ্টা করুন</p>
      </div>
    );
  }

  return (
    <>
      {items.map((seat) => {
        // Use pre-calculated stats from the hook
        const { totalVotes, leadingResult } = seat.stats;
        
        const isUpdatedRecently = recentSeatNos.includes(seat.seatNo);
        const isSuspended = seat.isSuspended;

        return (
          <div key={seat.seatNo} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow relative ${isSuspended ? 'border-red-300' : 'border-gray-200'}`}>
            
            {/* Suspended Overlay */}
            {isSuspended && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                    <div className="bg-red-100 p-3 rounded-full mb-2">
                        <AlertTriangle className="text-red-600 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-red-700">নির্বাচন স্থগিত</h3>
                    <p className="text-sm text-red-600 font-medium">এই আসনের ফলাফল স্থগিত ঘোষণা করা হয়েছে</p>
                    
                    {isAdminMode && (
                        <button 
                            onClick={() => onToggleSuspended(seat.seatNo, true)}
                            className="mt-4 flex items-center gap-2 bg-white border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-50"
                        >
                            <PlayCircle size={16} />
                            স্থগিতাদেশ প্রত্যাহার করুন
                        </button>
                    )}
                </div>
            )}

            <div className={`px-4 py-3 border-b flex justify-between items-center ${isSuspended ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`${isSuspended ? 'bg-gray-500' : 'bg-red-600'} text-white font-bold text-sm px-3 py-1 rounded shadow-sm`}>
                    {seat.seatNo}
                  </div>
                  
                  {/* Seat Index Badge */}
                  {seat.seatIndex && (
                    <div className="bg-white border border-gray-300 text-gray-600 text-xs px-2 py-1 rounded font-mono font-bold flex items-center shadow-sm">
                      <Hash size={10} className="mr-0.5 opacity-50" />
                      {seat.seatIndex}
                    </div>
                  )}

                  <div className="text-sm text-gray-600 font-medium ml-1">
                    {seat.district}
                  </div>
                  
                  {isUpdatedRecently && !isSuspended && (
                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse ml-auto sm:ml-0">
                      LIVE
                    </span>
                  )}
                </div>
                {seat.areaDescription && (
                  <div className="text-xs text-gray-500 truncate max-w-[300px] pl-1" title={seat.areaDescription}>
                    {seat.areaDescription}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                    <Clock size={12} />
                    {seat.updatedAt ? new Date(seat.updatedAt.seconds * 1000).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'}) : 'অপেক্ষমান'}
                  </div>
                  {isAdminMode && !isSuspended && (
                      <button 
                        onClick={() => onToggleSuspended(seat.seatNo, false)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        title="ফলাফল স্থগিত করুন"
                      >
                          <PauseCircle size={16} />
                      </button>
                  )}
              </div>
            </div>

            <div className="p-4">
              {seat.results.length > 0 ? (
                <div className="space-y-3">
                  {seat.results
                    .sort((a: any, b: any) => b.votes - a.votes)
                    .filter((r: any) => !filterParty || r.party === filterParty)
                    .map((result: any, rIdx: number) => {
                      const percent = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
                      const isDeclared = result.isDeclaredWinner;
                      
                      // Check if this result is the leader/winner based on stats
                      const isVisualWinner = isDeclared || (leadingResult && leadingResult.party === result.party && result.votes > 0);

                      const color = PARTY_COLORS[result.party] || '#9ca3af';
                      const candidateName = result.candidate || CANDIDATES[seat.seatNo]?.[result.party] || 'প্রার্থী';

                      return (
                        <div key={rIdx} className="relative">
                          <div className="flex justify-between items-end mb-1">
                            <div className="flex items-center gap-2">
                              {/* Winner Toggle - Only if allowed */}
                              {canDeclareWinner && (
                                  <input 
                                      type="checkbox"
                                      checked={isDeclared || false}
                                      onChange={(e) => onToggleWinner(seat.seatNo, result.party, isDeclared, seat.division, seat.district)}
                                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer accent-green-600"
                                      title="বিজয়ী ঘোষণা করতে টিক দিন"
                                  />
                              )}
                              
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                              <div>
                                <div className="font-bold text-gray-800 text-sm leading-none flex items-center">
                                  {result.party}
                                  {isDeclared && <Trophy size={12} className="inline ml-1 text-green-600" />}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{candidateName}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800 font-mono">
                                {result.votes.toLocaleString('bn-BD')}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {percent.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                            <div 
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${percent}%`, 
                                backgroundColor: isVisualWinner ? (isDeclared ? '#16a34a' : color) : '#d1d5db' 
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm italic">
                  ভোট গণনা শুরু হয়নি বা তথ্য নেই
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-400 font-medium">
                মোট ভোট: <span className="font-mono text-gray-600">{totalVotes.toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ResultsCardView;