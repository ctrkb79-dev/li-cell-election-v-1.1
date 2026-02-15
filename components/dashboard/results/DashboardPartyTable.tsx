import React from 'react';
import { Trophy } from 'lucide-react';
import { PARTY_COLORS } from '../../../constants';

interface PartyTableRow {
  name: string;
  wins: number;
  votes: number;
}

interface DashboardPartyTableProps {
  partyData: PartyTableRow[];
}

const DashboardPartyTable: React.FC<DashboardPartyTableProps> = ({ partyData }) => {
  return (
    <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs text-white uppercase bg-gray-800">
        <tr>
            <th className="px-6 py-4 border-r border-gray-700 text-center w-20">অবস্থান</th>
            <th className="px-6 py-4 border-r border-gray-700">দলের নাম</th>
            <th className="px-6 py-4 border-r border-gray-700 text-center">বিজয়ী আসন</th>
            <th className="px-6 py-4 text-right">মোট প্রাপ্ত ভোট</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {partyData.length > 0 ? (
            partyData.map((stat, idx) => {
            const rank = (idx + 1).toLocaleString('bn-BD');
            const isTop = idx === 0 && stat.wins > 0;

            return (
                <tr key={stat.name} className={`
                border-b border-gray-200 hover:bg-gray-50 transition-colors
                ${isTop ? 'bg-yellow-50' : 'bg-white'}
                `}>
                <td className="px-6 py-4 text-center border-r border-gray-200 font-bold text-gray-500">
                    #{rank}
                </td>
                <td className="px-6 py-4 border-r border-gray-200 font-bold text-gray-800 text-lg">
                    <span style={{ color: PARTY_COLORS[stat.name] || 'inherit' }}>
                        {stat.name}
                    </span>
                </td>
                <td className="px-6 py-4 text-center border-r border-gray-200">
                    <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-bold transition-transform
                        ${stat.wins > 0 
                        ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' 
                        : 'bg-gray-100 text-gray-400'}
                    `}>
                    {stat.wins > 0 && <Trophy size={12} className="mr-1.5" />}
                    {stat.wins.toLocaleString('bn-BD')} টি
                    </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-700 font-bold text-base">
                    {stat.votes.toLocaleString('bn-BD')}
                </td>
                </tr>
            );
            })
        ) : (
            <tr>
            <td colSpan={4} className="p-8 text-center text-gray-400">
                এখনো কোনো ফলাফল পাওয়া যায়নি
            </td>
            </tr>
        )}
        </tbody>
    </table>
  );
};

export default DashboardPartyTable;
