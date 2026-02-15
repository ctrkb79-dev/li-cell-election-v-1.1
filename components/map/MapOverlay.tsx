import React from 'react';
import { MapPin, Vote, Trophy } from 'lucide-react';

interface MapOverlayProps {
  stats: {
    seatCount: number;
    totalVotes: number;
    leadingParty: string;
    leadingWins: number;
  };
}

const MapOverlay: React.FC<MapOverlayProps> = ({ stats }) => {
  return (
    <div className="absolute top-10 right-2 z-[400] w-56 animate-in slide-in-from-right-2 fade-in mt-1">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-3 text-white shadow-xl border border-white/20 flex flex-col gap-2">
          
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase">
              <MapPin size={10} />
              দৃশ্যমান আসন
            </div>
            <div className="font-mono font-bold text-sm">{stats.seatCount}</div>
          </div>

          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold uppercase">
              <Vote size={10} />
              মোট ভোট
            </div>
            <div className="font-mono font-bold text-sm">{stats.totalVotes.toLocaleString('bn-BD')}</div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-green-200 text-[10px] font-bold uppercase mb-1">
              <Trophy size={10} />
              লিডিং দল
            </div>
            <div className="flex justify-between items-end">
                <div className="font-bold text-sm truncate max-w-[120px]">{stats.leadingParty || '-'}</div>
                <div className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  {stats.leadingWins} জয়
                </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default MapOverlay;