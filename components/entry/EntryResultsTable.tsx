
import React from 'react';
import { Trophy, User, CircleDot, Trash2 } from 'lucide-react';
import { PartyResult } from '../../types';

interface EntryResultsTableProps {
  results: PartyResult[];
  totalVotes: number;
  onUpdateResult: (party: string, field: keyof PartyResult, value: any) => void;
  onRemoveParty: (party: string) => void;
}

const EntryResultsTable: React.FC<EntryResultsTableProps> = ({ 
  results, totalVotes, onUpdateResult, onRemoveParty 
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
        উপরের তালিকা থেকে দল নির্বাচন করুন
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden animate-in fade-in bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 min-w-[220px]">দল, প্রার্থী ও প্রতীক</th>
              <th className="px-4 py-3 text-right w-32">প্রাপ্ত ভোট</th>
              <th className="px-4 py-3 text-center w-24">শতাংশ</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((result, idx) => {
              const percentage = totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : '0.0';
              const maxVotes = Math.max(...results.map(r => r.votes), 0);
              const isLeading = totalVotes > 0 && result.votes === maxVotes;
              const isDeclared = result.isDeclaredWinner;
              
              return (
                <tr key={idx} className={`transition-colors ${isDeclared ? 'bg-green-100' : (isLeading ? 'bg-blue-50' : 'bg-white hover:bg-gray-50')}`}>
                  <td className="px-4 py-2 font-medium text-gray-800 align-top">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-base">{result.party}</span>
                      {isDeclared ? (
                          <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-sm whitespace-nowrap">
                              <Trophy size={10} />
                              বিজয়ী
                          </span>
                      ) : isLeading && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold whitespace-nowrap">
                              এগিয়ে
                          </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {/* Candidate Name Input */}
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <input 
                            type="text"
                            value={result.candidate || ''}
                            onChange={(e) => onUpdateResult(result.party, 'candidate', e.target.value)}
                            placeholder="প্রার্থীর নাম"
                            className="text-xs border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full text-gray-700 placeholder:text-gray-300 py-0.5"
                          />
                        </div>
                        {/* Symbol Input */}
                        <div className="flex items-center gap-2">
                          <CircleDot size={14} className="text-gray-400 shrink-0" />
                          <input 
                            type="text"
                            value={result.symbol || ''}
                            onChange={(e) => onUpdateResult(result.party, 'symbol', e.target.value)}
                            placeholder="প্রতীক"
                            className="text-xs border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full text-gray-700 placeholder:text-gray-300 py-0.5"
                          />
                        </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right align-top pt-3">
                    <input
                      type="number"
                      value={result.votes || ''}
                      onChange={(e) => onUpdateResult(result.party, 'votes', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full min-w-[80px] text-right p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-gray-900 font-mono bg-white text-base shadow-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-center align-middle">
                    <div className="flex flex-col items-center justify-center w-24">
                      <span className="text-xs font-mono font-bold text-gray-600">{percentage}%</span>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${isDeclared ? 'bg-green-600' : (isLeading ? 'bg-blue-500' : 'bg-gray-400')}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onRemoveParty(result.party)}
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryResultsTable;
