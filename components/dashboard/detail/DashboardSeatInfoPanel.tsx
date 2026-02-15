import React from 'react';
import { MapPin, History, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface DashboardSeatInfoPanelProps {
  seatInfo: any;
}

const DashboardSeatInfoPanel: React.FC<DashboardSeatInfoPanelProps> = ({ seatInfo }) => {
  return (
    <div className="space-y-6">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur-sm">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
            <MapPin size={20} className="text-red-400" />
            নির্বাচনী এলাকা
            </h3>
            <div className="flex flex-wrap gap-2">
            {seatInfo.areas.map((area: string, i: number) => (
                <span key={i} className="bg-slate-700/50 border border-slate-600 px-3 py-1.5 rounded-lg text-sm text-slate-300 font-medium shadow-sm hover:bg-slate-700 transition-colors">
                {area}
                </span>
            ))}
            </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
            <History size={20} className="text-orange-400" />
            একাদশ সংসদ নির্বাচন (২০১৮)
            </h3>
            <div className="space-y-3">
            <div className="flex justify-between items-center text-sm p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 font-medium">বিজয়ী দল</span>
                <span className="font-bold text-white">বাংলাদেশ আওয়ামী লীগ</span>
            </div>
            <div className="flex justify-between items-center text-sm p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 font-medium">মোট ভোট</span>
                <span className="font-bold text-white font-mono">২,৪৫,০০০</span>
            </div>
            <div className="flex justify-between items-center text-sm p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 font-medium">ভোটের হার</span>
                <span className="font-bold text-white font-mono">৮২%</span>
            </div>
            </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
            <BarChart3 size={20} className="text-blue-400" />
            ভোটার বিশ্লেষণ
            </h3>
            <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={[
                    { name: 'পুরুষ', value: 52 },
                    { name: 'মহিলা', value: 48 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                    stroke="none"
                >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                </Pie>
                <RechartsTooltip 
                    contentStyle={{
                        backgroundColor: '#1e293b', 
                        borderColor: '#334155', 
                        color: '#fff',
                        borderRadius: '8px'
                    }} 
                    itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export default DashboardSeatInfoPanel;
