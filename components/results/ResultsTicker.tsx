import React from 'react';

interface ResultsTickerProps {
  items: string[];
}

const ResultsTicker: React.FC<ResultsTickerProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-red-700 text-white overflow-hidden relative whitespace-nowrap shadow-md border-b-4 border-red-900 group">
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            display: inline-block;
            animation: marquee 80s linear infinite;
        }
        .group:hover .animate-marquee {
            animation-play-state: paused;
        }
      `}</style>
      <div className="flex items-center absolute left-0 top-0 bottom-0 bg-red-800 px-3 z-10 font-bold text-sm shadow-md">
          ব্রেকিং
      </div>
      <div className="animate-marquee py-2 pl-20 inline-block">
          {items.map((item, i) => (
              <span key={i} className="mx-6 text-sm font-medium inline-flex items-center gap-2">
                  {item}
              </span>
          ))}
      </div>
    </div>
  );
};

export default ResultsTicker;