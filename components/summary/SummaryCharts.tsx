import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SummaryChartsProps {
  chartData: any[];
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

const SummaryCharts: React.FC<SummaryChartsProps> = ({ chartData, loading }) => {
  if (chartData.length === 0) {
    return (
      <div className="col-span-2 text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
        {loading ? "ডাটা লোড হচ্ছে..." : "এখনও কোনো দল আসন জিতেনি।"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
        <h3 className="text-sm font-bold text-gray-600 mb-4 text-center">আসন জয়ের পরিসংখ্যান (শুধুমাত্র বিজয়ী)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={12} tick={{fill: '#4B5563'}} />
              <YAxis fontSize={12} tick={{fill: '#4B5563'}} allowDecimals={false} />
              <Tooltip 
                formatter={(value: number) => [`${value} টি`, 'আসন']}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="wins" name="বিজয়" fill="#16a34a" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
        <h3 className="text-sm font-bold text-gray-600 mb-4 text-center">মোট ভোট বন্টন (শুধুমাত্র বিজয়ী)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="votes"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toLocaleString('bn-BD')} ভোট`, 'মোট ভোট']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SummaryCharts;