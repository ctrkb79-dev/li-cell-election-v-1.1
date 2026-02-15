import React from 'react';
import DashboardProgress from './DashboardProgress';
import DashboardDrillDown from './DashboardDrillDown';
import DashboardSingleSeatResult from './DashboardSingleSeatResult';

interface DashboardResultsTabProps {
  stats: any;
  drillDownData: any[];
  onRowClick: (row: any) => void;
  onBackSingleSeat: () => void;
  onDrillDownBack: () => void;
  filterDistrict: string;
  filterDivision: string;
}

const DashboardResultsTab: React.FC<DashboardResultsTabProps> = ({ 
  stats, drillDownData, onRowClick, onBackSingleSeat, onDrillDownBack, filterDistrict, filterDivision 
}) => {
  
  if (stats.isSingleSeat) {
    return (
        <DashboardSingleSeatResult 
            stats={stats} 
            onBack={onBackSingleSeat} 
        />
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in">
        <DashboardProgress 
            declared={stats.declaredSeats} 
            total={stats.totalSeats} 
            data={stats.partyBreakdown}
        />
        
        <DashboardDrillDown 
            data={drillDownData}
            partyData={stats.partyTableData}
            onRowClick={onRowClick} 
            title={filterDistrict ? 'আসন ভিত্তিক বিস্তারিত' : filterDivision ? 'জেলা ভিত্তিক বিস্তারিত' : 'বিভাগ ভিত্তিক বিস্তারিত'}
            isDetailed={!!filterDistrict}
            onBack={(filterDivision || filterDistrict) ? onDrillDownBack : undefined}
        />
    </div>
  );
};

export default DashboardResultsTab;