import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardSeatList from '../components/dashboard/DashboardSeatList';
import DashboardSeatDetail from '../components/dashboard/DashboardSeatDetail';
import DashboardResultsTab from '../components/dashboard/DashboardResultsTab';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import ResultsTicker from '../components/results/ResultsTicker';
import { useDashboardData } from '../hooks/useDashboardData';
import { Loader2 } from 'lucide-react';

const DashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'results' | 'charts' | 'info'>('results');
  
  const { 
    loading,
    filters, setFilters, handleResetFilters, availableParties,
    handleCardClick, cardStats, showLeading, setShowLeading,
    activeSeat, setViewingSeat,
    stats, drillDownData, visibleInfoList,
    handleRowClick, handleDrillDownBack,
    selectedSeatInfo, selectedSeatData,
    tickerItems
  } = useDashboardData();

  const showDetailPage = activeSeat && activeTab === 'info';

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
              <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
              <p className="text-lg font-medium">ডাটা লোড হচ্ছে...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-10 relative">
      
      {tickerItems.length > 0 && <ResultsTicker items={tickerItems} />}

      <DashboardHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showDetailPage={!!showDetailPage} 
      />

      {/* New Compact Card Stats */}
      {!showDetailPage && (
          <DashboardStats 
            winningStats={cardStats.winningStats}
            suspendedCount={cardStats.suspendedCount}
            pendingCount={cardStats.pendingCount}
            leadingStats={cardStats.leadingPendingStats}
            showLeading={showLeading}
            setShowLeading={setShowLeading}
            onCardClick={handleCardClick}
            activeFilter={filters.party || ''}
          />
      )}

      {!showDetailPage && (
        <FilterBar 
            division={filters.division} setDivision={setFilters.setDivision}
            district={filters.district} setDistrict={setFilters.setDistrict}
            seat={filters.seat} setSeat={setFilters.setSeat}
            party={filters.party} setParty={setFilters.setParty}
            onReset={handleResetFilters}
            title={activeTab === 'results' ? "ফলাফল ফিল্টার" : activeTab === 'charts' ? "চার্ট ফিল্টার" : "নির্বাচনী এলাকা ফিল্টার"}
            showParty={true} 
            searchTerm={filters.search}
            onSearchChange={setFilters.setSearch}
            searchPlaceholder="আসন বা এলাকা খুঁজুন..."
            partyOptions={availableParties}
        />
      )}

      {showDetailPage && selectedSeatInfo ? (
        <DashboardSeatDetail 
          seatNo={activeSeat}
          seatInfo={selectedSeatInfo}
          seatData={selectedSeatData}
          onBack={() => {
            setFilters.setSeat('');
            setViewingSeat('');
          }}
        />
      ) : (
        <>
          {activeTab === 'results' && (
            <DashboardResultsTab 
                stats={stats}
                drillDownData={drillDownData}
                onRowClick={handleRowClick}
                onBackSingleSeat={() => setFilters.setSeat('')}
                onDrillDownBack={handleDrillDownBack}
                filterDistrict={filters.district}
                filterDivision={filters.division}
            />
          )}

          {activeTab === 'charts' && (
             <div className="animate-in slide-in-from-bottom-4 fade-in">
                <DashboardCharts 
                    pieData={stats.pieData} 
                    barData={stats.barData} 
                />
             </div>
          )}

          {activeTab === 'info' && (
            <DashboardSeatList 
              items={visibleInfoList} 
              onSelect={(seat) => setFilters.setSeat(seat)} 
              onResetFilters={handleResetFilters} 
            />
          )}
        </>
      )}

    </div>
  );
};

export default DashboardView;