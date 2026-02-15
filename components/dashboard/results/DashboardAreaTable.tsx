import React from 'react';
import { ArrowRight, Users, AlertTriangle } from 'lucide-react';
import { PARTY_COLORS } from '../../../constants';

interface DrillDownRow {
  name: string;
  type: 'division' | 'district' | 'seat';
  total: number;
  declared: number;
  leader: string;
  seatIndex?: number;
}

interface DashboardAreaTableProps {
  data: DrillDownRow[];
  onRowClick: (row: DrillDownRow) => void;
  isDetailed: boolean;
}

const DashboardAreaTable: React.FC<DashboardAreaTableProps> = ({ data, onRowClick, isDetailed }) => {
  return (
    <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs text-white uppercase bg-gray-800">
        <tr>
            <th className="px-6 py-4 border-r border-gray-700">
            {isDetailed ? 'আসন' : 'এলাকা'}
            </th>
            <th className="px-6 py-4 text-center border-r border-gray-700">মোট আসন</th>
            <th className="px-6 py-4 text-center border-r border-gray-700">ফলাফল / অবস্থা</th>
            <th className="px-6 py-4 border-r border-gray-700">অগ্রগামী/বিজয়ী/অবস্থা</th>
            <th className="px-6 py-4 text-center border-r border-gray-700">অগ্রগতি</th>
            {!isDetailed && <th className="px-4 py-4 text-center w-10"></th>}
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {data.length > 0 ? (
            data.map((row, idx) => {
            const percent = row.total > 0 ? (row.declared / row.total) * 100 : 0;
            const isClickable = row.type !== 'seat';
            const isSuspended = row.leader === 'স্থগিত';
            
            return (
                <tr 
                key={idx} 
                onClick={() => isClickable && onRowClick(row)}
                className={`
                    transition-all duration-200 border-b border-gray-200 last:border-none
                    ${isClickable ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-gray-50'}
                `}
                >
                <td className="px-6 py-4 font-bold text-gray-800 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                    {row.name}
                    {row.seatIndex && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                        {row.seatIndex}
                        </span>
                    )}
                    </div>
                </td>
                <td className="px-6 py-4 text-center border-r border-gray-200 font-mono text-base font-bold text-gray-700">
                    {row.total}
                </td>
                <td className={`px-6 py-4 text-center border-r border-gray-200 font-mono font-bold text-base ${isSuspended ? 'text-red-600' : 'text-indigo-600'}`}>
                    {row.declared}
                </td>
                <td className="px-6 py-4 border-r border-gray-200">
                    {row.leader === '-' || row.leader === 'অপেক্ষমান' ? (
                    <span className="text-gray-400 text-xs italic bg-gray-100 px-2 py-1 rounded">অপেক্ষমান...</span>
                    ) : isSuspended ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100 border border-red-200 shadow-sm flex items-center gap-1 w-fit animate-pulse">
                            <AlertTriangle size={10} />
                            স্থগিত
                        </span>
                    ) : (
                    <span 
                        className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1 w-fit"
                        style={{ backgroundColor: PARTY_COLORS[row.leader] || '#9ca3af' }}
                    >
                        {row.leader === 'স্বতন্ত্র' && <Users size={10} />}
                        {row.leader}
                    </span>
                    )}
                </td>
                <td className="px-6 py-4 text-center align-middle border-r border-gray-200">
                    <div className="flex items-center gap-3 justify-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                        className={`h-2 rounded-full ${isSuspended ? 'bg-red-500' : (percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500')}`} 
                        style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-8">{percent.toFixed(0)}%</span>
                    </div>
                </td>
                {!isDetailed && (
                    <td className="px-4 py-4 text-center text-gray-400">
                    <ArrowRight size={16} />
                    </td>
                )}
                </tr>
            );
            })
        ) : (
            <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                    কোনো তথ্য পাওয়া যায়নি
                </td>
            </tr>
        )}
        </tbody>
    </table>
  );
};

export default DashboardAreaTable;