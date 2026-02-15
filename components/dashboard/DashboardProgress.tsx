import React from 'react';

interface PartySegment {
  name: string;
  count: number;
  color: string;
}

interface DashboardProgressProps {
  declared: number;
  total: number;
  data?: PartySegment[];
}

const DashboardProgress: React.FC<DashboardProgressProps> = ({ declared, total, data = [] }) => {
  const hasData = data && data.length > 0;
  
  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-lg mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-end mb-4">
        <div>
            <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                ফলাফল অগ্রগতি
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">দলভিত্তিক আসন বন্টনের লাইভ চিত্র</p>
        </div>
        <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-indigo-600 tracking-tight">{declared}</span>
                <span className="text-sm font-bold text-gray-400">/ {total}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                ঘোষিত আসন
            </div>
        </div>
      </div>
      
      {/* Progress Track */}
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex relative shadow-inner border border-gray-200">
        {hasData ? (
          data.map((item, idx) => {
            const widthPercent = (item.count / (total || 1)) * 100;
            if (widthPercent === 0) return null;
            
            return (
              <div 
                key={idx}
                className="h-full relative group transition-all duration-1000 ease-out hover:brightness-110 cursor-help"
                style={{ 
                  width: `${widthPercent}%`, 
                  backgroundColor: item.color 
                }}
              >
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        {item.name}: {item.count}
                    </div>
                    <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                </div>
                {/* Shine Effect for first item */}
                {idx === 0 && <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-white/30 to-transparent opacity-50"></div>}
              </div>
            );
          })
        ) : (
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 relative" 
            style={{ width: `${(declared / (total || 1)) * 100}%` }}
          >
             <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProgress;