import React from 'react';
import { Trophy } from 'lucide-react';
import { PARTY_COLORS } from '../../constants';

interface DashboardPartyGridProps {
  data: { name: string; value: number }[];
}

const DashboardPartyGrid: React.FC<DashboardPartyGridProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
      {data.map((item, idx) => {
        const color = PARTY_COLORS[item.name] || PARTY_COLORS['default'];
        return (
          <div 
            key={idx} 
            className="bg-white rounded-xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-gray-100 cursor-default group relative overflow-hidden"
            style={{ borderLeftColor: color }}
          >
             {/* Decorative Background Circle */}
             <div 
               className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-500"
               style={{ backgroundColor: color }}
             ></div>

             <div className="relative z-10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate mb-2" title={item.name}>
                  {item.name}
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-extrabold text-gray-800 leading-none">
                    {item.value}
                  </div>
                  <div className="text-[10px] font-medium text-gray-400 mb-1">
                    টি আসন
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-1.5">
                   <span 
                     className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-opacity-10"
                     style={{ backgroundColor: `${color}20`, color: color }}
                   >
                     <Trophy size={10} />
                     বিজয়
                   </span>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardPartyGrid;