
import React, { useState, useEffect } from 'react';
import { Loader2, Globe } from 'lucide-react';
import { GroundingChunk } from '../types';
import NewsHeader from '../components/news/NewsHeader';
import NewsContent from '../components/news/NewsContent';

const NewsView: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
        // Placeholder for Gemini API logic
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLastUpdated(new Date().toLocaleTimeString('bn-BD'));
    } catch (e: any) {
        console.error("News fetch error:", e?.message);
        setError("খবর লোড করতে সমস্যা হয়েছে।");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    // fetchNews(); 
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <NewsHeader 
        isLoading={isLoading} 
        lastUpdated={lastUpdated} 
        onRefresh={fetchNews} 
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {isLoading && !content ? (
         <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center min-h-[300px]">
           <Loader2 className="text-purple-600 animate-spin mb-4" size={48} />
           <p className="text-gray-800 font-medium text-lg">লাইভ আপডেট খোঁজা হচ্ছে...</p>
           <p className="text-gray-500 text-sm mt-2">অনুগ্রহ করে অপেক্ষা করুন, এআই সংবাদ বিশ্লেষণ করছে</p>
         </div>
      ) : content ? (
        <NewsContent content={content} sources={sources} />
      ) : (
        !isLoading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Globe className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-600">কোনো খবর পাওয়া যায়নি</h3>
            <button onClick={fetchNews} className="text-purple-600 hover:underline text-sm mt-1">আবার চেষ্টা করুন</button>
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