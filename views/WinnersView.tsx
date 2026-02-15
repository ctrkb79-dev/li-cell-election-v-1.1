import React, { useEffect, useRef } from 'react';
import WinnersStats from '../components/winners/WinnersStats';
import WinnersActions from '../components/winners/WinnersActions';
import WinnersList from '../components/winners/WinnersList';
import { Loader2 } from 'lucide-react';
import { useWinnersData } from '../hooks/useWinnersData';

const WinnersView: React.FC = () => {
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const {
    loading,
    filterParty, setFilterParty,
    filterStatus, 
    searchTerm, setSearchTerm,
    filteredWinners, currentItems, hasMore, loadMore,
    winningPartyStats, generalStats, leadingPendingStats,
    showLeading, setShowLeading,
    handleResetFilters, downloadReport, handleCardClick
  } = useWinnersData();

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadMore]);

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      <WinnersStats 
        stats={winningPartyStats} 
        generalStats={generalStats}
        leadingStats={leadingPendingStats}
        showLeading={showLeading}
        setShowLeading={setShowLeading}
        activePartyFilter={filterParty}
        activeStatusFilter={filterStatus}
        onCardClick={handleCardClick}
      />

      <WinnersActions 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onDownloadReport={downloadReport}
        onResetFilters={handleResetFilters}
        hasData={filteredWinners.length > 0}
        isFiltered={!!filterParty || !!searchTerm || filterStatus !== 'all'}
      />

      <WinnersList 
        items={currentItems}
        startIndex={0}
        loading={loading}
      />

      {/* Infinite Scroll Loader */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <Loader2 className="animate-spin text-yellow-600" size={18} />
            <span className="text-xs font-bold">আরও লোড হচ্ছে...</span>
          </div>
        </div>
      )}
      
      {!hasMore && currentItems.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-xs">
          আর কোনো তথ্য নেই
        </div>
      )}
    </div>
  );
};

export default WinnersView;