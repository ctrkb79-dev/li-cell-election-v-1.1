import React from 'react';
import { Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { PARTY_COLORS } from '../../constants';

interface DashboardBarChartProps {
  data: { name: string; votes: number }[];
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-[400px] flex flex-col">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-6 border-b pb-2">
        <Users size={20} className="text-indigo-500" />
        জনপ্রিয়তা যাচাই (শীর্ষ ৫ দল - ভোট)
      </h3>
      <div className="flex-1 min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }} 
              />
              <RechartsTooltip 
                formatter={(value: number) => [`${value.toLocaleString('bn-BD')} ভোট`]}
                cursor={{fill: '#f3f4f6', radius: 4}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="votes" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
            <Users size={40} className="opacity-20" />
            ভোটের তথ্য নেই
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBarChart;
