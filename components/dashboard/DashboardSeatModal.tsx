import React from 'react';
import { X, MapPin, Users, Building, Vote, UserCircle2, Activity, Trophy, History, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PARTY_COLORS } from '../../constants';
import { CANDIDATES } from '../../candidates';

interface PartyResult {
  party: string;
  votes: number;
  isDeclaredWinner?: boolean;
  candidate?: string;
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  totalVotes: number;
}

interface DashboardSeatModalProps {
  seatNo: string;
  seatInfo: any;
  seatData?: SeatData;
  onClose: () => void;
}

const getMockStats = (seed: string) => {
  let hash = 0;
  for(let i=0; i<seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const voters = 300000 + (Math.abs(hash) % 250000);
  const centers = 100 + (Math.abs(hash) % 150);
  return { voters, centers };
};

const DashboardSeatModal: React.FC<DashboardSeatModalProps> = ({ seatNo, seatInfo, seatData, onClose }) => {
  const mockStats = getMockStats(seatNo);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-start text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                আসন {seatInfo.seatIndex}
              </span>
              <span className="text-indigo-200 text-sm">
                {seatInfo.division} বিভাগ
              </span>
            </div>
            <h2 className="text-3xl font-bold">{seatInfo.seatNo}</h2>
            <div className="text-sm text-indigo-100 flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {seatInfo.district}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users size={18} />
                <span className="text-xs font-bold uppercase">মোট ভোটার</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{mockStats.voters.toLocaleString('bn-BD')}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Building size={18} />
                <span className="text-xs font-bold uppercase">ভোট কেন্দ্র</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{mockStats.centers.toLocaleString('bn-BD')}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Vote size={18} />
                <span className="text-xs font-bold uppercase">কাস্টিং ভোট</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {(seatData?.totalVotes || 0).toLocaleString('bn-BD')}
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <UserCircle2 size={18} />
                <span className="text-xs font-bold uppercase">প্রার্থী সংখ্যা</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {(CANDIDATES[seatInfo.seatNo] ? Object.keys(CANDIDATES[seatInfo.seatNo]).length : 0).toLocaleString('bn-BD')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Candidates & Results */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Activity className="text-indigo-600" size={20} />
                প্রার্থী ও ফলাফল
              </h3>
              
              <div className="space-y-3">
                {(() => {
                  const defaultCandidates = CANDIDATES[seatInfo.seatNo] || {};
                  const resultsMap = new Map<string, PartyResult>(seatData?.results.map(r => [r.party, r]) || []);
                  
                  const unifiedList = Object.entries(defaultCandidates).map(([party, name]) => {
                    const result = resultsMap.get(party);
                    return {
                      party,
                      name,
                      votes: result?.votes || 0,
                      isWinner: result?.isDeclaredWinner || false
                    };
                  });

                  seatData?.results.forEach(r => {
                    if (!defaultCandidates[r.party]) {
                      unifiedList.push({
                        party: r.party,
                        name: r.candidate || 'স্বতন্ত্র প্রার্থী',
                        votes: r.votes,
                        isWinner: r.isDeclaredWinner || false
                      });
                    }
                  });

                  const maxVotes = Math.max(...unifiedList.map(u => u.votes), 1);

                  return unifiedList.sort((a, b) => b.votes - a.votes).map((candidate, idx) => {
                    const color = PARTY_COLORS[candidate.party] || '#9ca3af';
                    const percent = (candidate.votes / maxVotes) * 100;

                    return (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {candidate.party.charAt(0)}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg leading-tight">
                                  {candidate.name}
                                </h4>
                                <div className="text-sm text-gray-500 font-medium mt-0.5">
                                  {candidate.party}
                                </div>
                              </div>
                              {candidate.isWinner && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200">
                                  <Trophy size={12} /> বিজয়ী
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1 font-semibold text-gray-600">
                                <span>প্রাপ্ত ভোট</span>
                                <span>{candidate.votes.toLocaleString('bn-BD')}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${percent}%`, backgroundColor: color }}
                                ></div>
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

            {/* Right Column: Info & History */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  নির্বাচনী এলাকা
                </h3>
                <div className="flex flex-wrap gap-2">
                  {seatInfo.areas.map((area: string, i: number) => (
                    <span key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600 shadow-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                  <History size={18} />
                  একাদশ সংসদ নির্বাচন (২০১৮)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">বিজয়ী দল</span>
                    <span className="font-bold text-gray-800">বাংলাদেশ আওয়ামী লীগ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">মোট ভোট</span>
                    <span className="font-bold text-gray-800">২,৪৫,০০০</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">ভোটের হার</span>
                    <span className="font-bold text-gray-800">৮২%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                  <BarChart3 size={18} />
                  ভোটার বিশ্লেষণ
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'পুরুষ', value: 52 },
                          { name: 'মহিলা', value: 48 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSeatModal;