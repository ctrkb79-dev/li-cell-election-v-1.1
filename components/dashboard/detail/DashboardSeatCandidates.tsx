import React from 'react';
import { Activity, Trophy, Radio, Anchor, Wheat, Hammer, Scale, User, CircleDot } from 'lucide-react';
import { PARTY_COLORS } from '../../../constants';
import { CANDIDATES } from '../../../candidates';

interface PartyResult {
  party: string;
  votes: number;
  isDeclaredWinner?: boolean;
  candidate?: string;
  symbol?: string;
}

interface DashboardSeatCandidatesProps {
  seatNo: string;
  seatInfo: any;
  seatData?: { results: PartyResult[] };
  totalCastVotes: number;
}

// Helper to get party symbol icon
const getPartySymbolIcon = (party: string) => {
  switch(party) {
    case 'আওয়ামী লীগ': return <Anchor size={16} />;
    case 'বিএনপি': return <Wheat size={16} />;
    case 'জাতীয় পার্টি': return <Hammer size={16} />;
    case 'জামায়াতে ইসলামী': return <Scale size={16} />;
    case 'স্বতন্ত্র': return <User size={16} />;
    case 'ইসলামী আন্দোলন': return <Activity size={16} />;
    default: return <CircleDot size={16} />;
  }
};

const DashboardSeatCandidates: React.FC<DashboardSeatCandidatesProps> = ({ seatNo, seatInfo, seatData, totalCastVotes }) => {
  return (
    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur-sm">
        <h3 className="font-bold text-xl text-white border-b border-slate-700 pb-4 mb-6 flex items-center gap-2">
            <Activity className="text-indigo-400" size={24} />
            প্রার্থী ও ফলাফল
        </h3>
        
        <div className="space-y-4">
            {(() => {
            const defaultCandidates = CANDIDATES[seatInfo.seatNo] || {};
            const resultsMap = new Map<string, PartyResult>(seatData?.results.map(r => [r.party, r]) || []);
            
            const unifiedList = Object.entries(defaultCandidates).map(([party, name]) => {
                const result = resultsMap.get(party);
                return {
                party,
                name,
                votes: result?.votes || 0,
                isWinner: result?.isDeclaredWinner || false,
                symbol: result?.symbol || ''
                };
            });

            seatData?.results.forEach(r => {
                if (!defaultCandidates[r.party]) {
                unifiedList.push({
                    party: r.party,
                    name: r.candidate || 'স্বতন্ত্র প্রার্থী',
                    votes: r.votes,
                    isWinner: r.isDeclaredWinner || false,
                    symbol: r.symbol || ''
                });
                }
            });

            const sortedList = unifiedList.sort((a, b) => b.votes - a.votes);
            const maxVotes = Math.max(...sortedList.map(u => u.votes), 1);
            const runnerUpVotes = sortedList.length > 1 ? sortedList[1].votes : 0;

            return sortedList.map((candidate, idx) => {
                const color = PARTY_COLORS[candidate.party] || '#64748b';
                const percent = totalCastVotes > 0 ? (candidate.votes / totalCastVotes) * 100 : 0;
                const isLeading = candidate.votes === maxVotes && candidate.votes > 0;
                const voteMargin = isLeading ? candidate.votes - runnerUpVotes : 0;

                return (
                <div key={idx} className={`relative overflow-hidden rounded-xl border transition-all duration-300 group
                    ${isLeading ? 'bg-slate-700/50 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}
                `}>
                    {/* Progress Bar Background */}
                    <div 
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/5 transition-all duration-1000 ease-out pointer-events-none"
                        style={{ width: `${percent}%`, opacity: 0.1 }}
                    />

                    <div className="p-5 flex items-center gap-5 relative z-10">
                        
                        {/* Candidate Photo with Zoom Effect */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 shadow-md group-hover:border-indigo-400 transition-colors">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${candidate.name.split(' ').join('+')}&background=${color.replace('#', '')}&color=fff&size=128&font-size=0.4`} 
                                    alt={candidate.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                            {/* Party Symbol Badge */}
                            <div 
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm border border-slate-800 font-bold overflow-hidden"
                                style={{ backgroundColor: color }}
                                title={candidate.symbol || candidate.party}
                            >
                                {candidate.symbol ? candidate.symbol : getPartySymbolIcon(candidate.party)}
                            </div>
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg leading-tight text-white group-hover:text-indigo-300 transition-colors">
                                        {candidate.name}
                                    </h4>
                                    <div className="text-sm text-slate-400 font-medium mt-1 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                                        {candidate.party} {candidate.symbol && <span className="text-slate-500">({candidate.symbol})</span>}
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    {candidate.isWinner ? (
                                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-500/30 shadow-sm animate-pulse ml-auto w-fit mb-1">
                                            <Trophy size={12} /> বিজয়ী
                                        </span>
                                    ) : isLeading ? (
                                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/30 ml-auto w-fit mb-1 flex items-center gap-1">
                                            <Radio size={10} className="animate-pulse" /> এগিয়ে
                                        </span>
                                    ) : null}
                                    <div className="font-bold text-2xl text-white font-mono leading-none">
                                        {percent.toFixed(1)}<span className="text-sm text-slate-500">%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>মোট ভোট</span>
                                        {isLeading && voteMargin > 0 && (
                                            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/20 normal-case tracking-normal font-mono">
                                                +{voteMargin.toLocaleString('bn-BD')} ভোটে এগিয়ে
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-mono text-white">{candidate.votes.toLocaleString('bn-BD')}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner border border-slate-600/50">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 relative flex items-center justify-end"
                                        style={{ width: `${percent}%`, backgroundColor: color }}
                                    >
                                        {percent > 5 && <div className="w-1 h-full bg-white/20 ml-auto"></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            });
            })()}
        </div>
    </div>
  );
};

export default DashboardSeatCandidates;
