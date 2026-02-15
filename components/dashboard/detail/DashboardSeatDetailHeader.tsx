import React from 'react';
import { ArrowLeft, MapPin, Camera, Share2 } from 'lucide-react';

interface DashboardSeatDetailHeaderProps {
  seatInfo: any;
  onBack: () => void;
  onShare: () => void;
  isSharing: boolean;
}

const DashboardSeatDetailHeader: React.FC<DashboardSeatDetailHeaderProps> = ({ seatInfo, onBack, onShare, isSharing }) => {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white border-b border-slate-700 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 p-10 opacity-5">
            <MapPin size={120} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-all hover:-translate-x-1 text-slate-200 border border-slate-600 shadow-lg"
                title="ফিরে যান"
                data-html2canvas-ignore
            >
                <ArrowLeft size={24} />
            </button>
            
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                        আসন {seatInfo.seatIndex}
                    </span>
                    
                    {/* Live Indicator */}
                    <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                        লাইভ গণনা চলছে
                    </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">{seatInfo.seatNo}</h2>
                <div className="text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
                <MapPin size={16} className="text-red-400" />
                {seatInfo.district} <span className="text-slate-500">|</span> {seatInfo.division} বিভাগ
                </div>
            </div>
            </div>

            {/* Share Button */}
            <button 
                onClick={onShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-indigo-600/80 border border-slate-600 hover:border-indigo-500 text-slate-200 hover:text-white rounded-lg text-sm font-medium transition-all shadow-sm backdrop-blur-sm"
                data-html2canvas-ignore
            >
                {isSharing ? <Camera size={16} className="animate-spin" /> : <Share2 size={16} />}
                {isSharing ? "সেভ হচ্ছে..." : "স্ন্যাপশট নিন"}
            </button>
        </div>
      </div>
  );
};

export default DashboardSeatDetailHeader;
