import React from 'react';
import { Loader2, RefreshCw, ExternalLink, Globe, Info, Clock } from 'lucide-react';
import { GroundingChunk } from './types';

interface NewsViewProps {
  content: string;
  sources: GroundingChunk[];
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;
  onRefresh: () => void;
}

const NewsView: React.FC<NewsViewProps> = ({ content, sources, isLoading, lastUpdated, error, onRefresh }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Section */}
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
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Content Area */}
      {isLoading && !content ? (
         <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center min-h-[300px]">
           <Loader2 className="text-purple-600 animate-spin mb-4" size={48} />
           <p className="text-gray-800 font-medium text-lg">লাইভ আপডেট খোঁজা হচ্ছে...</p>
           <p className="text-gray-500 text-sm mt-2">অনুগ্রহ করে অপেক্ষা করুন, এআই সংবাদ বিশ্লেষণ করছে</p>
         </div>
      ) : content ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main News Text */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Info size={20} className="text-purple-600" />
              আজকের ফলাফল ও সংবাদ
            </h3>
            <div className="prose prose-sm prose-purple max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {content}
            </div>
          </div>

          {/* Sources Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sticky top-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                সূত্রসমূহ (Sources)
              </h4>
              {sources.length > 0 ? (
                <ul className="space-y-2">
                  {sources.map((chunk, idx) => {
                    if (!chunk.web?.uri) return null;
                    return (
                      <li key={idx}>
                        <a 
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 p-2 rounded hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <ExternalLink size={14} className="mt-1 text-gray-400 group-hover:text-purple-600 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-purple-700 group-hover:underline line-clamp-2">
                              {chunk.web.title || "News Link"}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">
                              {new URL(chunk.web.uri).hostname}
                            </div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">সরাসরি কোনো সোর্স লিংক পাওয়া যায়নি।</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state - less likely due to auto-fetch but good fallback */
        !isLoading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Globe className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-600">কোনো খবর পাওয়া যায়নি</h3>
            <button onClick={onRefresh} className="text-purple-600 hover:underline text-sm mt-1">আবার চেষ্টা করুন</button>
          </div>
        )
      )}
      
      <div className="text-center text-xs text-gray-400 mt-8">
        * তথ্যগুলো Google AI (Gemini) ব্যবহার করে ইন্টারনেট থেকে সংগৃহীত। তথ্যের সত্যতা মূল লিংকে যাচাই করার অনুরোধ রইলো।
      </div>
    </div>
  );
};

export default NewsView;