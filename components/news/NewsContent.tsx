
import React from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { GroundingChunk } from '../../types';

interface NewsContentProps {
  content: string;
  sources: GroundingChunk[];
}

const NewsContent: React.FC<NewsContentProps> = ({ content, sources }) => {
  return (
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
  );
};

export default NewsContent;
