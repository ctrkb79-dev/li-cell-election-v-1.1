import React from 'react';
import { Users, Building, Vote, UserCircle2 } from 'lucide-react';

interface DashboardSeatStatsGridProps {
  votersCount: number;
  centersCount: number;
  totalVotes: number;
  candidateCount: number;
}

const DashboardSeatStatsGrid: React.FC<DashboardSeatStatsGridProps> = ({ votersCount, centersCount, totalVotes, candidateCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-lg hover:border-blue-500/30 transition-all group backdrop-blur-sm">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Users size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">মোট ভোটার</span>
        </div>
        <div className="text-2xl font-bold text-white font-mono">{votersCount.toLocaleString('bn-BD')}</div>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-lg hover:border-purple-500/30 transition-all group backdrop-blur-sm">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Building size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">ভোট কেন্দ্র</span>
        </div>
        <div className="text-2xl font-bold text-white font-mono">{centersCount.toLocaleString('bn-BD')}</div>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-lg hover:border-emerald-500/30 transition-all group backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Vote size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">কাস্টিং ভোট</span>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
            {totalVotes.toLocaleString('bn-BD')}
        </div>
        </div>
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-lg hover:border-amber-500/30 transition-all group backdrop-blur-sm">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
            <UserCircle2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">প্রার্থী সংখ্যা</span>
        </div>
        <div className="text-2xl font-bold text-white font-mono">
            {candidateCount.toLocaleString('bn-BD')}
        </div>
        </div>
    </div>
  );
};

export default DashboardSeatStatsGrid;
