import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { LOCATION_DATA, PARTIES, SEAT_DATA, SEAT_AREAS, SEAT_INDICES } from './constants';
import { CANDIDATES } from './candidates';
import { Filter, Search, RotateCcw, Download, Trophy, X, ChevronLeft, ChevronRight, FileText, Users } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { PartyResult } from './types';

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  upazilas: string[];
  totalVotes: number;
}

const WinnersView: React.FC = () => {
  const [data, setData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const fetchedData: SeatData[] = [];
        querySnapshot.forEach((doc) => {
          fetchedData.push(doc.data() as SeatData);
        });
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleWinner = async (seatNo: string, partyName: string, currentStatus: boolean) => {
    // 1. Optimistic UI Update: Update local state immediately
    setData(prevData => {
      return prevData.map(seat => {
        if (seat.seatNo === seatNo) {
           const newResults = seat.results.map(r => {
             if (r.party === partyName) {
               return { ...r, isDeclaredWinner: !currentStatus };
             }
             return r;
           });
           return { ...seat, results: newResults };
        }
        return seat;
      });
    });

    // 2. Update Firebase
    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);
      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        const updatedResults = seatData.results.map(r => {
             if (r.party === partyName) {
               return { ...r, isDeclaredWinner: !currentStatus };
             }
             return r;
        });
        await updateDoc(seatRef, {
            results: updatedResults,
            updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Error updating winner:", e);
      alert("ডাটাবেসে আপডেট করতে সমস্যা হয়েছে।");
      // Ideally revert state here on error, but keeping simple for now
    }
  };

  // Filter Logic: Show ONLY declared winners
  const filteredWinners = useMemo(() => {
    const winnersList: {
      seatNo: string;
      seatIndex?: number;
      division: string;
      district: string;
      party: string;
      votes: number;
      candidate?: string;
      isDeclaredWinner?: boolean;
      areaDescription?: string;
    }[] = [];

    data.forEach(seat => {
        seat.results.forEach(result => {
            if (result.isDeclaredWinner) {
                // Determine candidate name: use DB value if exists, else fallback to static list
                const candidateName = result.candidate || CANDIDATES[seat.seatNo]?.[result.party];
                winnersList.push({
                    seatNo: seat.seatNo,
                    seatIndex: SEAT_INDICES[seat.seatNo],
                    division: seat.division,
                    district: seat.district,
                    party: result.party,
                    candidate: candidateName,
                    votes: result.votes,
                    isDeclaredWinner: true,
                    areaDescription: SEAT_AREAS[seat.seatNo]?.join(', ') || ''
                });
            }
        });
    });

    return winnersList.filter(item => {
      // Global Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            item.seatNo.toLowerCase().includes(term) ||
            (item.seatIndex && item.seatIndex.toString().includes(term)) ||
            item.division.toLowerCase().includes(term) ||
            item.district.toLowerCase().includes(term) ||
            (item.areaDescription && item.areaDescription.toLowerCase().includes(term)) ||
            item.party.toLowerCase().includes(term) ||
            (item.candidate && item.candidate.toLowerCase().includes(term));
        
        if (!matchesSearch) return false;
      }

      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      if (filterSeat && item.seatNo !== filterSeat) return false;
      if (filterParty && item.party !== filterParty) return false;
      
      return true;
    });
  }, [data, filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

  // Calculate Specific Party Stats BASED ON FILTERED DATA
  const specificPartyStats = useMemo(() => {
    const stats = {
      'বিএনপি': 0,
      'জামায়াতে ইসলামী': 0,
      'এনসিপি': 0,
      'স্বতন্ত্র': 0
    };

    filteredWinners.forEach(winner => {
        if (winner.party === 'বিএনপি') stats['বিএনপি']++;
        else if (winner.party === 'জামায়াতে ইসলামী') stats['জামায়াতে ইসলামী']++;
        else if (winner.party === 'এনসিপি') stats['এনসিপি']++;
        else if (winner.party === 'স্বতন্ত্র') stats['স্বতন্ত্র']++;
    });

    return stats;
  }, [filteredWinners]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

  // Derived Options for Dropdowns
  const districts = useMemo(() => {
    if (!filterDivision) return [];
    return Object.keys(LOCATION_DATA[filterDivision] || {});
  }, [filterDivision]);

  const seats = useMemo(() => {
    if (!filterDistrict) return [];
    return SEAT_DATA[filterDistrict] || [];
  }, [filterDistrict]);

  const clearFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
    setSearchTerm('');
  };

  // Pagination Calculations
  const totalPages = Math.ceil(filteredWinners.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredWinners.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
     const delta = 1; 
     const range = [];
     const rangeWithDots = [];
     let l;

     range.push(1);
     for (let i = currentPage - delta; i <= currentPage + delta; i++) {
         if (i < totalPages && i > 1) {
             range.push(i);
         }
     }
     if (totalPages > 1) range.push(totalPages);

     for (let i of range) {
         if (l) {
             if (i - l === 2) {
                 rangeWithDots.push(l + 1);
             } else if (i - l !== 1) {
                 rangeWithDots.push('...');
             }
         }
         rangeWithDots.push(i);
         l = i;
     }
     return rangeWithDots;
  };

  // Helper function to calculate total seats for the current filter scope
  const getTotalSeatsForScope = () => {
    // 1. Specific Seat Selected -> 1
    if (filterSeat) return 1;

    // 2. District Selected -> Count seats in district
    if (filterDistrict) {
      return SEAT_DATA[filterDistrict]?.length || 0;
    }

    // 3. Division Selected -> Sum seats of all districts in division
    if (filterDivision) {
      const dists = Object.keys(LOCATION_DATA[filterDivision] || {});
      return dists.reduce((acc, dist) => acc + (SEAT_DATA[dist]?.length || 0), 0);
    }

    // 4. No Filter -> Total 300
    // Calculate dynamically or return static 300
    let total = 0;
    Object.values(SEAT_DATA).forEach(seats => total += seats.length);
    return total > 0 ? total : 300;
  };

  const downloadReport = () => {
    if (filteredWinners.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }

    const now = new Date();
    // Format: ১২/২/২০২৬, ৯:৫১:৫৭ PM
    const dateStr = now.toLocaleDateString('bn-BD');
    const timeStr = now.toLocaleTimeString('bn-BD');

    let content = "শ্রদ্ধেয় জেনারেল\n";
    content += "আসসালামু আলাইকুম স্যার,\n\n";
    content += "*চূড়ান্ত বিজয়ী তালিকা*\n";
    content += `তারিখ: ${dateStr}, ${timeStr}\n`;
    content += "===============================\n";

    // Dynamic Filter Line
    let filterLine = "";
    if (filterDivision) {
        filterLine += `বিভাগ: ${filterDivision}`;
        if (filterDistrict) {
            filterLine += `, জেলা: ${filterDistrict}`;
        }
        content += filterLine + "\n";
    }

    // Summary Line
    // Calculate total seats based on the geographic scope (Constants), not just DB entries
    const totalScopeSeats = getTotalSeatsForScope().toLocaleString('bn-BD');
    
    const bnpCount = (specificPartyStats['বিএনপি'] || 0).toLocaleString('bn-BD');
    const jamaatCount = (specificPartyStats['জামায়াতে ইসলামী'] || 0).toLocaleString('bn-BD');
    const ncpCount = (specificPartyStats['এনসিপি'] || 0).toLocaleString('bn-BD');
    const indCount = (specificPartyStats['স্বতন্ত্র'] || 0).toLocaleString('bn-BD');

    content += `সারাংশ: মোট আসন ${totalScopeSeats}টি। বিএনপি-${bnpCount}টি আসন, জামায়েত-${jamaatCount}টি আসন, এনসিপি-${ncpCount}টি আসন, স্বতন্ত্র-${indCount}টি আসন\n\n`;

    // Sort winners: Division (Primary) -> Seat No (Secondary)
    const sortedWinners = [...filteredWinners].sort((a, b) => {
        // First sort by Division
        const divCompare = a.division.localeCompare(b.division, 'bn');
        if (divCompare !== 0) return divCompare;
        
        // Then sort by Seat Number (Natural numeric sort)
        return a.seatNo.localeCompare(b.seatNo, 'bn', { numeric: true });
    });

    let currentDivision = "";

    sortedWinners.forEach((winner, index) => {
        // Add Section Header if Division changes
        if (winner.division !== currentDivision) {
            content += `\n[ বিভাগ: ${winner.division} ]\n`;
            currentDivision = winner.division;
        }

        const serial = (index + 1).toLocaleString('bn-BD');
        const candidateInfo = winner.candidate ? ` (${winner.candidate})` : "";
        const areaInfo = winner.areaDescription ? ` (${winner.areaDescription})` : "";
        const indexInfo = winner.seatIndex ? ` [আসন নং: ${winner.seatIndex}]` : "";
        // ১। আসন: কুড়িগ্রাম-৪ [আসন নং: ২৮] (চিলমারী, রৌমারী...), দল: জামায়াতে ইসলামী
        content += `${serial}। আসন: ${winner.seatNo}${indexInfo}${areaInfo}, দল: ${winner.party}${candidateInfo}\n`;
    });

    content += "\nওআইসি, বিজিবি এলআই সেল।";

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `winners_report_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Specific Party Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* BNP */}
        <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform duration-200">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <Users size={48} />
           </div>
           <h3 className="text-sm font-bold opacity-90 border-b border-blue-400 pb-1 mb-1 w-full text-center">বিএনপি</h3>
           <span className="text-4xl font-bold">{specificPartyStats['বিএনপি'].toLocaleString('bn-BD')}</span>
           <span className="text-[10px] opacity-70">টি আসন</span>
        </div>

        {/* Jamaat */}
        <div className="bg-green-600 rounded-xl p-4 text-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform duration-200">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <Users size={48} />
           </div>
           <h3 className="text-sm font-bold opacity-90 border-b border-green-400 pb-1 mb-1 w-full text-center">জামায়াতে ইসলামী</h3>
           <span className="text-4xl font-bold">{specificPartyStats['জামায়াতে ইসলামী'].toLocaleString('bn-BD')}</span>
           <span className="text-[10px] opacity-70">টি আসন</span>
        </div>

        {/* NCP */}
        <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform duration-200">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <Users size={48} />
           </div>
           <h3 className="text-sm font-bold opacity-90 border-b border-indigo-400 pb-1 mb-1 w-full text-center">এনসিপি</h3>
           <span className="text-4xl font-bold">{specificPartyStats['এনসিপি'].toLocaleString('bn-BD')}</span>
           <span className="text-[10px] opacity-70">টি আসন</span>
        </div>

        {/* Independent */}
        <div className="bg-slate-600 rounded-xl p-4 text-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform duration-200">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <Users size={48} />
           </div>
           <h3 className="text-sm font-bold opacity-90 border-b border-slate-400 pb-1 mb-1 w-full text-center">স্বতন্ত্র</h3>
           <span className="text-4xl font-bold">{specificPartyStats['স্বতন্ত্র'].toLocaleString('bn-BD')}</span>
           <span className="text-[10px] opacity-70">টি আসন</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3 border-b pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-yellow-700 font-semibold">
            <Trophy size={18} />
            বিজয়ী তালিকা ফিল্টার
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="খুঁজুন..."
                className="pl-7 pr-6 py-1.5 text-xs border border-gray-300 rounded-full focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none w-28 sm:w-40 transition-all text-gray-700 bg-gray-50"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {filteredWinners.length > 0 && (
               <button
                 onClick={downloadReport}
                 className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-full transition-all border border-blue-200 hover:border-blue-600"
               >
                 <FileText size={12} />
                 নোটপ্যাড ডাউনলোড
               </button>
            )}

            {(filterDivision || filterDistrict || filterSeat || filterParty || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-white hover:bg-gray-600 px-3 py-1.5 rounded-full transition-all border border-gray-200 hover:border-gray-600"
              >
                <RotateCcw size={12} />
                রিসেট
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchableSelect
            options={Object.keys(LOCATION_DATA)}
            value={filterDivision}
            onChange={(val) => {
              setFilterDivision(val);
              setFilterDistrict('');
              setFilterSeat('');
            }}
            placeholder="সকল বিভাগ"
          />

          <SearchableSelect
            options={districts}
            value={filterDistrict}
            onChange={(val) => {
              setFilterDistrict(val);
              setFilterSeat('');
            }}
            disabled={!filterDivision}
            placeholder="সকল জেলা"
          />

          <SearchableSelect
            options={seats}
            value={filterSeat}
            onChange={(val) => setFilterSeat(val)}
            disabled={!filterDistrict}
            placeholder="সকল আসন"
          />

          <SearchableSelect
            options={PARTIES}
            value={filterParty}
            onChange={(val) => setFilterParty(val)}
            placeholder="সকল দল"
          />
        </div>
      </div>

      {/* Winners Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-white uppercase bg-yellow-700">
              <tr>
                <th scope="col" className="px-4 py-3 border border-yellow-800 text-center w-16">ক্রমিক নং</th>
                <th scope="col" className="px-4 py-3 border border-yellow-800 text-center w-32">আসন নং</th>
                <th scope="col" className="px-4 py-3 border border-yellow-800">দল</th>
                <th scope="col" className="px-4 py-3 border border-yellow-800 text-center">প্রাপ্ত ভোট</th>
                <th scope="col" className="px-4 py-3 border border-yellow-800 text-center">ফলাফল</th>
                <th scope="col" className="px-4 py-3 border border-yellow-800 text-center">টিক (বাতিল)</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((winner, idx) => (
                  <tr key={`${winner.seatNo}-${winner.party}`} className="bg-white border-b hover:bg-yellow-50 text-gray-800 transition-colors">
                    <td className="px-4 py-3 border border-gray-300 text-center font-medium align-middle">
                      {(startIndex + idx + 1).toLocaleString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 border border-gray-300 text-center font-bold align-middle">
                      <div className="text-lg">{winner.seatNo}</div>
                      {winner.seatIndex && (
                        <div className="text-xs bg-gray-100 text-gray-500 px-1 rounded inline-block mt-0.5 font-mono">
                          #{winner.seatIndex}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-500 font-normal mt-1 leading-tight max-w-[150px] mx-auto">
                         {winner.areaDescription || winner.district}
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-gray-300 font-medium align-middle">
                      <div>{winner.party}</div>
                      {winner.candidate && (
                        <div className="text-xs text-gray-500">{winner.candidate}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 border border-gray-300 text-center font-mono align-middle">
                      {winner.votes.toLocaleString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 border border-gray-300 text-center align-middle">
                      <span className="inline-flex items-center justify-center gap-1.5 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                        <Trophy size={14} className="shrink-0" />
                        <span>ঘোষিত বিজয়ী</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-gray-300 text-center align-middle">
                        <input 
                            type="checkbox"
                            checked={winner.isDeclaredWinner}
                            onChange={() => handleToggleWinner(winner.seatNo, winner.party, true)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            title="বিজয় বাতিল করতে টিক উঠিয়ে দিন"
                        />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ঘোষিত বিজয়ী পাওয়া যায়নি। ফলাফল ট্যাবে গিয়ে টিক চিহ্ন দিন।"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredWinners.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    পূর্ববর্তী
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    পরবর্তী
                  </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      মোট <span className="font-medium text-yellow-700">{filteredWinners.length.toLocaleString('bn-BD')}</span> জনের মধ্যে{' '}
                      <span className="font-medium">{(startIndex + 1).toLocaleString('bn-BD')}</span> থেকে{' '}
                      <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredWinners.length).toLocaleString('bn-BD')}</span> দেখানো হচ্ছে
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {getPageNumbers().map((page, idx) => (
                          typeof page === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => goToPage(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === page
                                ? 'z-10 bg-yellow-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page.toLocaleString('bn-BD')}
                          </button>
                          ) : (
                            <span key={idx} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                              ...
                            </span>
                          )
                      ))}

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default WinnersView;