import React from 'react';
import DashboardPieChart from './DashboardPieChart';
import DashboardBarChart from './DashboardBarChart';

interface DashboardChartsProps {
  pieData: { name: string; value: number }[];
  barData: { name: string; votes: number }[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ pieData, barData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <DashboardPieChart data={pieData} />
      <DashboardBarChart data={barData} />
    </div>
  );
};

export default DashboardCharts;
