import React, { useRef, useEffect } from 'react';
import { Loader2, LayoutGrid, Table, Image as ImageIcon, Download, Lock, Unlock, FileText, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import FilterBar from '../components/FilterBar';
import ResultsCardView from '../components/results/ResultsCardView';
import ResultsTableView from '../components/results/ResultsTableView';
import { useResultsData } from '../hooks/useResultsData';

interface ResultsViewProps {
  isAdminMode: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ isAdminMode }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const {
    dbData, recentSeatNos, loading, viewMode, setViewMode,
    filters, setFilters,
    loadMore, hasMore,
    currentItems, allParties, 
    handleResetFilters, 
    handleToggleSuspended, confirmToggleSuspended,
    handleToggleWinner, confirmChangeWinner,
    downloadReport,
    MANDATORY_PARTIES, confirmModalData, setConfirmModalData, suspendModalData, setSuspendModalData
  } = useResultsData(isAdminMode);

  const { division, district, seat, party, search } = filters;
  const { setDivision, setDistrict, setSeat, setParty, setSearch } = setFilters;

  // Logic to determine if user can declare winner.
  // Currently, we assume isAdminMode = All Permissions since there's no auth context.
  // In a real scenario, this would be: `isAdminMode && userPermissions.includes('manage_winner')`
  const canDeclareWinner = isAdminMode; 

  const downloadImage = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `election_results_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      // Safe logging
      console.error("Error generating image:", error?.message || "Unknown error");
      alert("ইমেজ ডাউনলোড করতে সমস্যা হয়েছে।");
    }
  };

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
        
      {/* Collapsible Filter Bar */}
      <FilterBar 
        division={division} setDivision={(val) => { setDivision(val); setDistrict(''); setSeat(''); }}
        district={district} setDistrict={(val) => { setDistrict(val); setSeat(''); }}
        seat={seat} setSeat={setSeat}
        party={party} setParty={setParty}
        onReset={handleResetFilters}
        title="ফলাফল ফিল্টার"
        showParty={true}
        partyOptions={allParties}
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="আসন, জেলা বা প্রার্থী খুঁজুন..."
        rightContent={
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-medium ${viewMode === 'cards' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        title="কার্ড ভিউ"
                    >
                        <LayoutGrid size={14} />
                        <span className="hidden sm:inline">কার্ড</span>
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-medium ${viewMode === 'table' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        title="টেবিল ভিউ"
                    >
                        <Table size={14} />
                        <span className="hidden sm:inline">টেবিল</span>
                    </button>
                </div>

                {/* Actions */}
                <button onClick={downloadImage} className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 font-medium transition-colors border border-purple-200">
                    <ImageIcon size={14} /> <span className="hidden sm:inline">স্ন্যাপশট</span>
                </button>
                
                <button
                    onClick={downloadReport}
                    className="flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-blue-200"
                >
                    <FileText size={14} /> <span className="hidden sm:inline">রিপোর্ট</span>
                </button>
            </div>
        }
      />

      <div ref={tableRef} className="space-y-4">
          {viewMode === 'cards' ? (
             <ResultsCardView 
               items={currentItems} 
               filterParty={party} 
               recentSeatNos={recentSeatNos} 
               isAdminMode={isAdminMode}
               canDeclareWinner={canDeclareWinner}
               onToggleWinner={handleToggleWinner}
               onToggleSuspended={handleToggleSuspended}
             />
          ) : (
             <ResultsTableView 
               items={currentItems} 
               startIndex={0} 
               filterParty={party} 
               mandatoryParties={MANDATORY_PARTIES} 
               loading={loading} 
               recentSeatNos={recentSeatNos} 
               isAdminMode={isAdminMode}
               canDeclareWinner={canDeclareWinner}
               onToggleWinner={handleToggleWinner} 
               onToggleSuspended={handleToggleSuspended}
             />
          )}
      </div>

      {/* Infinite Scroll Loader */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
            <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <Loader2 className="animate-spin text-red-600" size={18} />
                <span className="text-xs font-bold">আরও লোড হচ্ছে...</span>
            </div>
        </div>
      )}
      
      {!hasMore && currentItems.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-xs border-t border-dashed border-gray-200 mt-4">
            -- আর কোনো ফলাফল নেই --
        </div>
      )}

      {/* Winner Confirmation Modal */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 animate-pulse ${confirmModalData.action === 'revoke' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        {confirmModalData.action === 'revoke' 
                            ? <AlertTriangle className="h-8 w-8 text-red-600" />
                            : <HelpCircle className="h-8 w-8 text-yellow-600" />
                        }
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {confirmModalData.action === 'revoke' ? 'বিজয় বাতিল?' : confirmModalData.action === 'switch' ? 'বিজয় পরিবর্তন?' : 'বিজয় ঘোষণা?'}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                        {confirmModalData.action === 'switch' && (
                             <p className="bg-red-50 text-red-600 px-2 py-1 rounded inline-block mb-1 font-medium">
                                বর্তমানে <strong>{confirmModalData.oldParty}</strong> বিজয়ী।
                             </p>
                        )}
                        <p>
                            আপনি কি <strong>{confirmModalData.party}</strong>-কে 
                            {confirmModalData.action === 'revoke' 
                                ? ' বিজয়ী তালিকা থেকে বাদ দিতে চান?' 
                                : ' বিজয়ী ঘোষণা করতে চান?'}
                        </p>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button
                        onClick={() => setConfirmModalData(null)}
                        className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    >
                        না
                    </button>
                    <button
                        onClick={confirmChangeWinner}
                        className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors ${confirmModalData.action === 'revoke' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
                    >
                        {confirmModalData.action === 'revoke' ? 'হ্যাঁ, বাতিল করুন' : 'হ্যাঁ, ঘোষণা করুন'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 animate-pulse ${suspendModalData.currentStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                        <AlertCircle className={`h-8 w-8 ${suspendModalData.currentStatus ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {suspendModalData.currentStatus ? 'স্থগিতাদেশ প্রত্যাহার?' : 'ফলাফল স্থগিত?'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        আপনি কি <strong>{suspendModalData.seatNo}</strong> আসনের নির্বাচনী ফলাফল {suspendModalData.currentStatus ? 'পুনরায় চালু' : 'স্থগিত'} করতে চান?
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-100">
                    <button
                        onClick={() => setSuspendModalData(null)}
                        className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    >
                        না
                    </button>
                    <button
                        onClick={confirmToggleSuspended}
                        className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors ${suspendModalData.currentStatus ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                    >
                        হ্যাঁ, নিশ্চিত করছি
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ResultsView;