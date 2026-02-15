import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PARTY_COLORS } from '../../constants';

interface DashboardPieChartProps {
  data: { name: string; value: number }[];
}

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-[400px] flex flex-col">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-6 border-b pb-2">
        <PieIcon size={20} className="text-indigo-500" />
        দলভিত্তিক আসন বন্টন
      </h3>
      <div className="flex-1 min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value} টি আসন`, name]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
            <PieIcon size={40} className="opacity-20" />
            কোনো ফলাফল পাওয়া যায়নি
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPieChart;
