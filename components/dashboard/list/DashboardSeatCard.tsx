import React from 'react';
import { ArrowRight, MapPin, Crown, AlertTriangle } from 'lucide-react';
import { PARTY_COLORS } from '../../../constants';

interface SeatInfoItem {
  seatNo: string;
  division: string;
  district: string;
  seatIndex: number;
  areas: string[];
  winner?: {
    party: string;
    votes: number;
  };
  isSuspended?: boolean;
}

interface DashboardSeatCardProps {
  item: SeatInfoItem;
  onSelect: (seatNo: string) => void;
}

const DashboardSeatCard: React.FC<DashboardSeatCardProps> = ({ item, onSelect }) => {
  const winner = item.winner;
  const isSuspended = item.isSuspended;
  
  const borderColor = isSuspended 
    ? '#ef4444' // Red for suspended
    : winner 
        ? (PARTY_COLORS[winner.party] || '#16a34a') 
        : '#14b8a6'; // Default teal

  return (
    <div 
      onClick={() => onSelect(item.seatNo)}
      className={`bg-white rounded-xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-full relative 
        ${isSuspended ? 'border-red-300 bg-red-50 hover:border-red-400' : 'border-gray-200 hover:border-opacity-50'}
      `}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 w-full transition-colors duration-500" 
        style={{ backgroundColor: borderColor }}
      ></div>
      
      <div className="p-5 flex flex-col flex-grow relative">
        <div className="flex justify-between items-start mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border 
            ${isSuspended ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            আসন {item.seatIndex}
          </span>
          <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 transform group-hover:translate-x-1 transition-all duration-300" />
        </div>
        
        <h3 className={`text-xl font-bold transition-colors mb-1 leading-tight ${isSuspended ? 'text-red-700' : 'text-gray-800 group-hover:text-teal-700'}`}>
          {item.seatNo}
        </h3>
        
        <div className={`text-xs font-medium mb-3 flex items-center gap-1 ${isSuspended ? 'text-red-500' : 'text-gray-500'}`}>
          <MapPin size={10} />
          {item.district}, {item.division}
        </div>

        {isSuspended ? (
            <div className="mt-auto mb-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-2.5 rounded-lg border flex items-center justify-center gap-2 bg-red-100 border-red-200 shadow-sm">
                    <AlertTriangle size={16} className="text-red-600 animate-pulse" />
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">নির্বাচন স্থগিত</span>
                </div>
            </div>
        ) : winner ? (
          <div className="mt-auto mb-3 animate-in fade-in zoom-in-95 duration-300">
            <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 bg-opacity-10`} 
               style={{ 
                 backgroundColor: `${PARTY_COLORS[winner.party] || '#e5e7eb'}15`, 
                 borderColor: `${PARTY_COLORS[winner.party] || '#d1d5db'}40` 
               }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                style={{ backgroundColor: PARTY_COLORS[winner.party] || '#6b7280' }}
              >
                {winner.party.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: PARTY_COLORS[winner.party] || '#374151' }}>
                  <Crown size={10} />
                  বিজয়ী
                </div>
                <div className="text-sm font-bold text-gray-800 truncate" title={winner.party}>
                  {winner.party}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto mb-3 h-[54px]"></div>
        )}
        
        <div className={`border-t pt-3 mt-auto ${isSuspended ? 'border-red-200' : 'border-gray-100'}`}>
          <div className="flex flex-wrap gap-1.5">
            {item.areas.slice(0, 3).map((area, idx) => (
              <span key={idx} className={`inline-block px-2 py-1 text-[10px] rounded border font-medium truncate max-w-[80px]
                ${isSuspended 
                    ? 'bg-white text-red-500 border-red-100' 
                    : 'bg-gray-50 text-gray-600 border-gray-200/60'}`
              }>
                {area}
              </span>
            ))}
            {item.areas.length > 3 && (
              <span className={`inline-block px-2 py-1 text-[10px] rounded border
                ${isSuspended ? 'bg-white text-red-400 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-200/60'}`}>
                +{item.areas.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSeatCard;