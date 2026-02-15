import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import DashboardSeatDetailHeader from './detail/DashboardSeatDetailHeader';
import DashboardSeatStatsGrid from './detail/DashboardSeatStatsGrid';
import DashboardSeatCandidates from './detail/DashboardSeatCandidates';
import DashboardSeatInfoPanel from './detail/DashboardSeatInfoPanel';
import { CANDIDATES } from '../../candidates';

interface PartyResult {
  party: string;
  votes: number;
  isDeclaredWinner?: boolean;
  candidate?: string;
  symbol?: string; 
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  totalVotes: number;
  totalVoters?: number;
  totalCenters?: number;
}

interface DashboardSeatDetailProps {
  seatNo: string;
  seatInfo: any;
  seatData?: SeatData;
  onBack: () => void;
}

const DashboardSeatDetail: React.FC<DashboardSeatDetailProps> = ({ seatNo, seatInfo, seatData, onBack }) => {
  const detailRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Use Real Data if available, otherwise default to 0
  const votersCount = seatData?.totalVoters || 0;
  const centersCount = seatData?.totalCenters || 0;
  const candidateCount = seatData?.results?.length || (CANDIDATES[seatInfo.seatNo] ? Object.keys(CANDIDATES[seatInfo.seatNo]).length : 0);

  // Calculate percentages
  const totalCastVotes = seatData?.results.reduce((sum, r) => sum + r.votes, 0) || 0;

  const handleShare = async () => {
    if (!detailRef.current) return;
    setIsSharing(true);
    try {
        const canvas = await html2canvas(detailRef.current, {
            scale: 2,
            backgroundColor: '#0f172a', // Keep dark background
            useCORS: true,
            logging: false
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `Result_${seatNo}_${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error: any) {
        console.error("Snapshot failed:", error?.message || "Unknown error");
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <div ref={detailRef} className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 min-h-[80vh]">
      
      <DashboardSeatDetailHeader 
        seatInfo={seatInfo} 
        onBack={onBack} 
        onShare={handleShare} 
        isSharing={isSharing} 
      />

      {/* Scrollable Content */}
      <div className="p-6 md:p-8 space-y-8 bg-slate-900">
        
        <DashboardSeatStatsGrid 
            votersCount={votersCount}
            centersCount={centersCount}
            totalVotes={seatData?.totalVotes || 0}
            candidateCount={candidateCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Candidates & Results */}
          <div className="lg:col-span-2">
            <DashboardSeatCandidates 
                seatNo={seatNo}
                seatInfo={seatInfo}
                seatData={seatData}
                totalCastVotes={totalCastVotes}
            />
          </div>

          {/* Right Column: Info & History */}
          <div className="lg:col-span-1">
            <DashboardSeatInfoPanel seatInfo={seatInfo} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSeatDetail;