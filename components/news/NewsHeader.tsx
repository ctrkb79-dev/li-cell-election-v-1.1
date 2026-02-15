
import React from 'react';
import { Globe, Loader2, RefreshCw, Clock } from 'lucide-react';

interface NewsHeaderProps {
  isLoading: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
}

const NewsHeader: React.FC<NewsHeaderProps> = ({ isLoading, lastUpdated, onRefresh }) => {
  return (
    <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Globe className="text-purple-300" />
          লাইভ ইলেকেশন ফলাফল আপডেট (AI)
        </h2>
        <p className="text-purple-100 text-sm max-w-xl">
          স্বয়ংক্রিয়ভাবে আজকের নির্বাচনের ফলাফল এবং ব্রেকিং নিউজ সরাসরি টিভি ও পত্রিকা থেকে সংগ্রহ করা হচ্ছে।
        </p>
        
        <div className="mt-6 flex items-center gap-4">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white text-purple-900 hover:bg-purple-50 font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-70 shadow-md"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              {isLoading ? "আপডেট হচ্ছে..." : "রিফ্রেশ করুন"}
            </button>
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full border border-purple-700/50">
                <Clock size={12} />
                সর্বশেষ আপডেট: {lastUpdated}
              </span>
            )}
        </div>
      </div>
      
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
    </div>
  );
};

export default NewsHeader;
