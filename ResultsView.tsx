import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { LOCATION_DATA, PARTIES, SEAT_DATA, PARTY_COLORS, SEAT_AREAS, SEAT_INDICES } from './constants';
import { CANDIDATES } from './candidates';
import { Loader2, Filter, Trophy, RotateCcw, Download, Image as ImageIcon, Clock, ChevronLeft, ChevronRight, Trash2, Search, X, Activity, Table, LayoutGrid } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import html2canvas from 'html2canvas';

interface PartyResult {
  party: string;
  votes: number;
  candidate?: string;
  isDeclaredWinner?: boolean;
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  upazilas: string[];
  totalVotes: number;
  updatedAt?: any; // Firestore Timestamp
}

interface StaticSeatInfo {
  seatNo: string;
  division: string;
  district: string;
  results?: PartyResult[]; // Made optional to match StaticSeatInfo structure from constants potentially
}

interface MergedSeatData extends StaticSeatInfo {
  seatIndex: number;
  results: PartyResult[];
  upazilas: string[];
  totalVotes: number;
  updatedAt: any;
  hasDbEntry: boolean;
  areaDescription: string;
}

const MANDATORY_PARTIES = ["বিএনপি", "জামায়াতে ইসলামী", "এনসিপি", "স্বতন্ত্র"];

const ResultsView: React.FC = () => {
  const [dbData, setDbData] = useState<Record<string, SeatData>>({});
  const [recentSeatNos, setRecentSeatNos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filters
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; 

  // Generate Master List of 300 Seats
  const masterSeatList = useMemo(() => {
    const list: StaticSeatInfo[] = [];
    const distToDiv: Record<string, string> = {};
    
    // Map District to Division
    Object.keys(LOCATION_DATA).forEach(div => {
      Object.keys(LOCATION_DATA[div]).forEach(dist => {
        distToDiv[dist] = div;
      });
    });

    // Flatten Seat Data
    Object.keys(SEAT_DATA).forEach(dist => {
      const seats = SEAT_DATA[dist];
      const div = distToDiv[dist] || '';
      seats.forEach(s => {
        list.push({
          seatNo: s,
          district: dist,
          division: div
        });
      });
    });
    return list;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const dataMap: Record<string, SeatData> = {};
        const fetchedList: SeatData[] = [];

        querySnapshot.forEach((doc) => {
          const d = doc.data() as SeatData;
          dataMap[d.seatNo] = d;
          fetchedList.push(d);
        });

        // Identify recently updated seats
        fetchedList.sort((a, b) => {
          const tA = a.updatedAt?.seconds || 0;
          const tB = b.updatedAt?.seconds || 0;
          return tB - tA; 
        });
        const top5 = fetchedList.slice(0, 10).map(s => s.seatNo);
        setRecentSeatNos(top5);

        setDbData(dataMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge Static List with DB Data
  const mergedData = useMemo<MergedSeatData[]>(() => {
    return masterSeatList.map(staticSeat => {
      const dbEntry = dbData[staticSeat.seatNo];
      const seatIndex = SEAT_INDICES[staticSeat.seatNo];
      return {
        ...staticSeat,
        seatIndex,
        results: dbEntry?.results || [],
        upazilas: dbEntry?.upazilas || [],
        totalVotes: dbEntry?.totalVotes || 0,
        updatedAt: dbEntry?.updatedAt,
        hasDbEntry: !!dbEntry,
        areaDescription: SEAT_AREAS[staticSeat.seatNo]?.join(', ') || ''
      };
    });
  }, [masterSeatList, dbData]);

  // Extract all unique parties from data for the filter dropdown
  const allParties = useMemo(() => {
    const uniqueParties = new Set(PARTIES);
    // Add parties found in fetched data
    Object.values(dbData).forEach((seat: SeatData) => {
      seat.results.forEach(r => uniqueParties.add(r.party));
    });
    return Array.from(uniqueParties).sort();
  }, [dbData]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return mergedData.filter(item => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            item.seatNo.toLowerCase().includes(term) ||
            (item.seatIndex && item.seatIndex.toString().includes(term)) ||
            item.division.toLowerCase().includes(term) ||
            item.district.toLowerCase().includes(term) ||
            item.areaDescription.toLowerCase().includes(term) ||
            item.results.some(r => r.party.toLowerCase().includes(term));
        
        if (!matchesSearch) return false;
      }

      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      if (filterSeat && item.seatNo !== filterSeat) return false;
      
      // Party Filter Logic
      if (filterParty) {
         const isMandatory = MANDATORY_PARTIES.includes(filterParty);
         const hasResult = item.results.some(r => r.party === filterParty);
         // If it's not a mandatory party and has no data in DB, filter it out
         if (!isMandatory && !hasResult) return false;
      }

      return true;
    });
  }, [mergedData, filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

  // Ticker Data Generation (Now based on filteredData)
  const tickerItems = useMemo(() => {
    const items: string[] = [];
    filteredData.forEach(seat => {
        const winner = seat.results.find(r => r.isDeclaredWinner);
        const indexStr = seat.seatIndex ? `(${seat.seatIndex})` : '';
        if (winner) {
            items.push(`🔴 ${seat.seatNo} ${indexStr}: ${winner.party} বিজয়ী (${winner.votes.toLocaleString('bn-BD')} ভোট)`);
        } else if (seat.results.length > 0) {
             const sorted = [...seat.results].sort((a,b) => b.votes - a.votes);
             if (sorted[0] && sorted[0].votes > 0) {
                 items.push(`⚪ ${seat.seatNo} ${indexStr}: ${sorted[0].party} এগিয়ে (${sorted[0].votes.toLocaleString('bn-BD')})`);
             }
        }
    });
    return items.slice(0, 15);
  }, [filteredData]);

  // Dashboard Stats Calculation (Now based on filteredData)
  const dashboardStats = useMemo(() => {
      const stats: Record<string, number> = {};
      let totalDeclared = 0;

      filteredData.forEach(seat => {
          const winner = seat.results.find(r => r.isDeclaredWinner);
          if (winner) {
              stats[winner.party] = (stats[winner.party] || 0) + 1;
              totalDeclared++;
          }
      });
      
      // Sort by wins
      const sortedStats = Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .map(([party, wins]) => ({ party, wins }));

      return { sortedStats, totalDeclared, totalCount: filteredData.length };
  }, [filteredData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

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

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteResult = async (seatNo: string, partyName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে আপনি ${seatNo} আসন থেকে ${partyName}-এর ফলাফল মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);

      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        const updatedResults = seatData.results.filter(r => r.party !== partyName);
        const newTotalVotes = updatedResults.reduce((sum, r) => sum + r.votes, 0);

        await updateDoc(seatRef, {
          results: updatedResults,
          totalVotes: newTotalVotes
        });

        setDbData(prev => ({
          ...prev,
          [seatNo]: {
            ...prev[seatNo],
            results: updatedResults,
            totalVotes: newTotalVotes
          }
        }));
      }
    } catch (error) {
      console.error("Error deleting result:", error);
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  const handleToggleWinner = async (seatNo: string, partyName: string, currentStatus: boolean, division: string, district: string) => {
    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);
      
      let updatedResults: PartyResult[] = [];
      let newTotalVotes = 0;

      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        updatedResults = [...seatData.results];
        const existingIndex = updatedResults.findIndex(r => r.party === partyName);

        if (existingIndex >= 0) {
          updatedResults[existingIndex] = {
            ...updatedResults[existingIndex],
            isDeclaredWinner: !currentStatus
          };
        } else {
          updatedResults.push({
            party: partyName,
            votes: 0,
            candidate: CANDIDATES[seatNo]?.[partyName] || '',
            isDeclaredWinner: true
          });
        }
        newTotalVotes = seatData.totalVotes; 
      } else {
        // Create new doc if it doesn't exist
        updatedResults = [{
          party: partyName,
          votes: 0,
          candidate: CANDIDATES[seatNo]?.[partyName] || '',
          isDeclaredWinner: true
        }];
        newTotalVotes = 0;
      }

      await setDoc(seatRef, {
        seatNo,
        division,
        district,
        results: updatedResults,
        totalVotes: newTotalVotes,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update Local State Immediately
      setDbData(prev => ({
        ...prev,
        [seatNo]: {
            ...prev[seatNo], // spread previous seat data if exists
            seatNo,
            division,
            district,
            results: updatedResults,
            totalVotes: newTotalVotes,
            upazilas: prev[seatNo]?.upazilas || [],
            updatedAt: { seconds: Date.now() / 1000 }
        }
      }));

    } catch (error) {
      console.error("Error toggling winner:", error);
      alert("আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  const handleDeleteAll = async () => {
    if (Object.keys(dbData).length === 0) {
        alert("মুছে ফেলার মতো কোনো ডাটা নেই।");
        return;
    }

    if (!window.confirm("⚠️ সতর্কতা: আপনি কি ডাটাবেস থেকে **সকল আসনের** নির্বাচনী ফলাফল মুছে ফেলতে চান?")) {
      return;
    }

    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "seats"));
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
         batch.update(doc.ref, {
           results: [],
           totalVotes: 0,
           updatedAt: serverTimestamp()
         });
      });

      await batch.commit();
      
      // Reset local DB data
      const clearedDbData: Record<string, SeatData> = {};
      Object.keys(dbData).forEach(key => {
          clearedDbData[key] = {
              ...dbData[key],
              results: [],
              totalVotes: 0
          };
      });
      setDbData(clearedDbData);
      
      alert("✅ সমস্ত ফলাফল সফলভাবে মুছে ফেলা হয়েছে।");

    } catch (error) {
      console.error("Error deleting all data:", error);
      alert("ডাটা মুছতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const downloadTextReport = () => {
    if (filteredData.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }

    let content = "শ্রদ্ধেয় জেনারেল\n";
    content += "আসসালামু আলাইকুম স্যার,\n\n";
    content += "*নির্বাচনী ফলাফল রিপোর্ট*\n";
    content += `তারিখ: ${new Date().toLocaleString('bn-BD')}\n`;
    content += "===============================\n\n";

    filteredData.forEach(seat => {
      let partiesToShow = [...MANDATORY_PARTIES];
      // Add others with votes
      seat.results.forEach(r => {
          if (!partiesToShow.includes(r.party) && r.votes > 0) {
              partiesToShow.push(r.party);
          }
      });

      if (filterParty) {
          partiesToShow = partiesToShow.filter(p => p === filterParty);
      }

      if (partiesToShow.length > 0) {
        const areaInfo = seat.areaDescription ? ` (${seat.areaDescription})` : "";
        const indexInfo = seat.seatIndex ? ` [আসন নং: ${seat.seatIndex}]` : "";
        content += `*${seat.seatNo}${indexInfo}${areaInfo}*\n`;
        content += "---------------------------------\n";
        
        const maxVotes = Math.max(...seat.results.map(r => r.votes), 0);

        partiesToShow.forEach((partyName, index) => {
           const existing = seat.results.find(r => r.party === partyName);
           const votes = existing ? existing.votes : 0;
           const isDeclared = existing?.isDeclaredWinner;
           
           const isVoteWinner = votes === maxVotes && votes > 0;
           const isWinner = isVoteWinner || isDeclared;
           
           const winnerText = isWinner ? " *(বিজয়ী)*" : "";
           const candidateName = existing?.candidate || CANDIDATES[seat.seatNo]?.[partyName] || "";
           const candidateText = candidateName ? ` (${candidateName})` : "";
           const serial = (index + 1).toLocaleString('bn-BD');
           
           const voteDisplay = votes > 0 ? `${votes.toLocaleString('bn-BD')} ভোট` : "শূন্য/পাওয়া যায়নি";
           
           content += `${serial}। ${partyName}${candidateText}: ${voteDisplay}${winnerText}\n`;
        });
        content += "\n";
      }
    });

    content += "ওআইসি, বিজিবি এলআই সেল।";

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `election_report_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
    } catch (error) {
      console.error("Error generating image:", error);
      alert("ইমেজ ডাউনলোড করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
        <style>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            display: inline-block;
            animation: marquee 30s linear infinite;
        }
        `}</style>

      {/* 1. Breaking News Ticker */}
      {tickerItems.length > 0 && (
          <div className="bg-red-700 text-white overflow-hidden relative whitespace-nowrap shadow-md border-b-4 border-red-900">
            <div className="flex items-center absolute left-0 top-0 bottom-0 bg-red-800 px-3 z-10 font-bold text-sm shadow-md">
                ব্রেকিং
            </div>
            <div className="animate-marquee py-2 pl-20 inline-block">
                {tickerItems.map((item, i) => (
                    <span key={i} className="mx-6 text-sm font-medium inline-flex items-center gap-2">
                        {item}
                    </span>
                ))}
            </div>
          </div>
      )}

      {/* 2. Dashboard Header (Stats) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-red-600" />
                    নির্বাচনী ফলাফল ড্যাশবোর্ড
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">লাইভ আপডেট ও বিস্তারিত পরিসংখ্যান</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                  <div className="text-sm text-gray-500 font-medium">মোট আসন</div>
                  <div className="text-3xl font-bold text-gray-800">
                      {dashboardStats.totalDeclared} <span className="text-lg text-gray-400">/ {dashboardStats.totalCount}</span>
                  </div>
              </div>
          </div>

          {/* Party Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {dashboardStats.sortedStats.length > 0 ? (
                  dashboardStats.sortedStats.map((stat, idx) => {
                      const color = PARTY_COLORS[stat.party] || PARTY_COLORS['default'];
                      return (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border-t-4 shadow-sm" style={{ borderColor: color }}>
                              <div className="text-xs font-bold text-gray-500 uppercase truncate" title={stat.party}>{stat.party}</div>
                              <div className="text-2xl font-bold text-gray-800 mt-1">{stat.wins}</div>
                              <div className="text-[10px] text-gray-400">বিজয়</div>
                          </div>
                      )
                  })
              ) : (
                  <div className="col-span-full text-center text-gray-400 py-4 italic">কোনো ফলাফল ঘোষিত হয়নি</div>
              )}
          </div>
      </div>

      {/* 3. Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-[70px] z-30">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-3 mb-3">
            <div className="flex items-center gap-2 font-semibold text-gray-700 w-full lg:w-auto">
                <Search size={18} />
                <span className="whitespace-nowrap">আসন খুঁজুন</span>
            </div>
            
            <div className="flex flex-1 flex-col sm:flex-row justify-end items-center gap-3 w-full lg:w-auto">
                {/* Search Input - Pill Shaped with Yellow Border */}
                <div className="relative w-full sm:w-60">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="খুঁজুন..." 
                        className="w-full pl-9 pr-8 py-1.5 bg-white border-2 border-yellow-400 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-200 transition-all placeholder:text-gray-400 text-gray-700"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'cards' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        title="কার্ড ভিউ"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        title="টেবিল ভিউ"
                    >
                        <Table size={16} />
                    </button>
                </div>

                <div className="flex gap-2 items-center flex-wrap justify-end">
                    <button onClick={downloadImage} className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 font-medium transition-colors">
                        <ImageIcon size={14} /> স্ন্যাপশট
                    </button>
                    <button
                        onClick={downloadTextReport}
                        className="flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                        <Download size={14} /> রিপোর্ট
                    </button>
                    
                    {Object.keys(dbData).length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-red-200"
                        >
                            <Trash2 size={14} /> সব মুছুন
                        </button>
                    )}

                    {(filterDivision || filterDistrict || filterSeat || searchTerm) && (
                        <button onClick={clearFilters} className="text-xs flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 font-medium transition-colors">
                            <RotateCcw size={14} /> রিসেট
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
           <SearchableSelect
              options={Object.keys(LOCATION_DATA)}
              value={filterDivision}
              onChange={(val) => { setFilterDivision(val); setFilterDistrict(''); setFilterSeat(''); }}
              placeholder="বিভাগ"
           />
           <SearchableSelect
              options={districts}
              value={filterDistrict}
              onChange={(val) => { setFilterDistrict(val); setFilterSeat(''); }}
              disabled={!filterDivision}
              placeholder="জেলা"
           />
           <SearchableSelect
              options={seats}
              value={filterSeat}
              onChange={setFilterSeat}
              disabled={!filterDistrict}
              placeholder="আসন"
           />
           <SearchableSelect
              options={allParties}
              value={filterParty}
              onChange={setFilterParty}
              placeholder="দল নির্বাচন করুন"
           />
        </div>
      </div>

      {/* 4. Results List (Toggle between Cards and Table) */}
      <div ref={tableRef} className="space-y-4">
          {viewMode === 'cards' ? (
             // Card View (Current Modern Design)
             currentItems.map((seat, idx) => {
                const totalVotes = seat.results.reduce((sum, r) => sum + r.votes, 0);
                const maxVotes = Math.max(...seat.results.map(r => r.votes), 0);
                const winner = seat.results.find(r => r.isDeclaredWinner) || 
                               (totalVotes > 0 ? seat.results.reduce((p, c) => p.votes > c.votes ? p : c) : null);
                
                const isDeclared = winner?.isDeclaredWinner;
                const isUpdatedRecently = recentSeatNos.includes(seat.seatNo);

                return (
                    <div key={seat.seatNo} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-600 text-white font-bold text-sm px-3 py-1 rounded">
                                        {seat.seatNo}
                                    </div>
                                    {seat.seatIndex && (
                                        <div className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-mono">
                                            #{seat.seatIndex}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-600">
                                        {seat.district}
                                    </div>
                                    {isUpdatedRecently && (
                                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                {seat.areaDescription && (
                                    <div className="text-xs text-gray-500 truncate max-w-[300px]" title={seat.areaDescription}>
                                        {seat.areaDescription}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                {seat.updatedAt ? new Date(seat.updatedAt.seconds * 1000).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'}) : 'অপেক্ষমান'}
                            </div>
                        </div>

                        <div className="p-4">
                            {seat.results.length > 0 ? (
                                <div className="space-y-3">
                                    {seat.results
                                      .sort((a,b) => b.votes - a.votes)
                                      .filter(r => !filterParty || r.party === filterParty)
                                      .map((result, rIdx) => {
                                        const percent = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
                                        const isWinner = result.party === winner?.party && (result.votes > 0 || result.isDeclaredWinner);
                                        const color = PARTY_COLORS[result.party] || '#9ca3af';
                                        const candidateName = result.candidate || CANDIDATES[seat.seatNo]?.[result.party] || 'প্রার্থী';

                                        return (
                                            <div key={rIdx} className="relative">
                                                <div className="flex justify-between items-end mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm leading-none">
                                                                {result.party}
                                                                {isWinner && isDeclared && <Trophy size={12} className="inline ml-1 text-green-600" />}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{candidateName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-800 font-mono">
                                                            {result.votes.toLocaleString('bn-BD')}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono">
                                                            {percent.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ 
                                                            width: `${percent}%`, 
                                                            backgroundColor: isWinner ? (isDeclared ? '#16a34a' : color) : '#d1d5db' 
                                                        }}
                                                    ></div>
                                                </div>
                                                
                                                <div className="absolute right-0 top-0 -mt-1 opacity-0 hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDeleteResult(seat.seatNo, result.party)} className="p-1 text-red-300 hover:text-red-500">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-sm italic">
                                    ভোট গণনা শুরু হয়নি বা তথ্য নেই
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                                মোট ভোট: {totalVotes.toLocaleString('bn-BD')}
                            </div>
                        </div>
                    </div>
                );
             })
          ) : (
             // Table View (Restored Detailed Table)
             <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse">
                   <thead className="text-xs text-white uppercase bg-red-700">
                     <tr>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center w-16">ক্রমিক</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center w-32">আসন নং</th>
                       <th scope="col" className="px-4 py-3 border border-red-800">দল ও প্রার্থী</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center">প্রাপ্ত ভোট</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center">ফলাফল</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center">মন্তব্য / সময়</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center w-16">বিজয়</th>
                       <th scope="col" className="px-4 py-3 border border-red-800 text-center w-16">অ্যাকশন</th>
                     </tr>
                   </thead>
                   <tbody>
                     {currentItems.length > 0 ? (
                       currentItems.map((seat, seatIdx) => {
                         // Determine list of parties to show
                         const partiesToShow = [...MANDATORY_PARTIES];
                         seat.results.forEach(r => {
                             if (!partiesToShow.includes(r.party)) {
                                 partiesToShow.push(r.party);
                             }
                         });

                         // Construct row data
                         let combinedResults = partiesToShow.map(partyName => {
                           const existing = seat.results.find(r => r.party === partyName);
                           return {
                             party: partyName,
                             votes: existing ? existing.votes : 0,
                             candidate: existing?.candidate || CANDIDATES[seat.seatNo]?.[partyName] || '',
                             isDeclaredWinner: existing?.isDeclaredWinner || false,
                             hasEntry: !!existing
                           };
                         });

                         // Calculate Winner
                         const maxVotes = Math.max(...seat.results.map(r => r.votes), 0);
                         const winners = seat.results.filter(r => r.votes === maxVotes && r.votes > 0);
                         const isRecent = recentSeatNos.includes(seat.seatNo);
                         
                         if (filterParty) {
                           combinedResults = combinedResults.filter(r => r.party === filterParty);
                         }

                         if (combinedResults.length === 0) return null;

                         return combinedResults.map((result, resultIdx) => {
                           const isVoteWinner = winners.some(w => w.party === result.party);
                           const isManualWinner = result.isDeclaredWinner;
                           
                           return (
                             <tr key={`${seat.seatNo}-${result.party}`} className="bg-white border-b hover:bg-gray-50 text-gray-800">
                               <td className="px-4 py-3 border border-gray-300 text-center font-medium align-middle">
                                 {(startIndex + seatIdx + 1).toLocaleString('bn-BD')}
                                </td>

                               {resultIdx === 0 && (
                                 <td 
                                   className="px-4 py-3 border border-gray-300 text-center font-bold bg-gray-50 align-middle"
                                   rowSpan={combinedResults.length}
                                 >
                                   <div className="text-lg">{seat.seatNo}</div>
                                   {seat.seatIndex && (
                                     <div className="text-xs bg-gray-200 text-gray-600 px-1 rounded inline-block mt-1 font-mono">
                                       #{seat.seatIndex}
                                     </div>
                                   )}
                                   <div className="text-xs text-gray-500 font-normal mt-1 leading-tight">
                                     {seat.areaDescription || seat.district}
                                   </div>
                                 </td>
                               )}

                               <td className="px-4 py-3 border border-gray-300 font-medium align-middle">
                                 <div className="font-bold">{result.party}</div>
                                 {result.candidate && (
                                   <div className="text-xs text-gray-600 mt-0.5">{result.candidate}</div>
                                 )}
                               </td>
                               <td className="px-4 py-3 border border-gray-300 text-center font-mono align-middle">
                                 {result.votes > 0 ? result.votes.toLocaleString('bn-BD') : ''}
                               </td>
                               <td className="px-4 py-3 border border-gray-300 text-center font-bold align-middle">
                                 {isVoteWinner || isManualWinner ? (
                                   <div className="flex justify-center items-center w-full">
                                     <span className="inline-flex items-center justify-center gap-1.5 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold border border-green-200 whitespace-nowrap shadow-sm">
                                       <Trophy size={14} className="shrink-0" />
                                       <span>বিজয়ী</span>
                                     </span>
                                   </div>
                                 ) : '-'}
                               </td>
                               <td className="px-4 py-3 border border-gray-300 align-middle text-center w-32">
                                 {resultIdx === 0 && (
                                   <div className="flex flex-col items-center justify-center gap-1">
                                     {isRecent && (
                                       <span className="inline-block text-red-600 text-[10px] font-bold border border-red-200 bg-red-50 px-2 py-0.5 rounded animate-pulse whitespace-nowrap">
                                         নতুন আপডেট
                                       </span>
                                     )}
                                     {seat.updatedAt && (
                                       <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                          <Clock size={10} />
                                          {new Date(seat.updatedAt.seconds * 1000).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                     )}
                                   </div>
                                 )}
                               </td>

                               <td className="px-4 py-3 border border-gray-300 text-center align-middle">
                                   <input 
                                       type="checkbox"
                                       checked={result.isDeclaredWinner}
                                       onChange={() => handleToggleWinner(seat.seatNo, result.party, result.isDeclaredWinner, seat.division, seat.district)}
                                       className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                       title="বিজয়ী ঘোষণা করতে টিক দিন"
                                   />
                               </td>
                               
                               <td className="px-4 py-3 border border-gray-300 text-center align-middle">
                                 {result.hasEntry && result.votes > 0 ? (
                                   <button 
                                     onClick={() => handleDeleteResult(seat.seatNo, result.party)}
                                     className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                     title="ভোট মুছুন"
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                 ) : (
                                   <span className="text-gray-300 text-xs">-</span>
                                 )}
                               </td>
                             </tr>
                           );
                         });
                       })
                     ) : (
                       <tr>
                         <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                           {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ফলাফল পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।"}
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
          
          {currentItems.length === 0 && viewMode === 'cards' && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <Filter className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">কোনো ফলাফল পাওয়া যায়নি</h3>
                  <p className="text-gray-500">অন্য ফিল্টার ব্যবহার করে চেষ্টা করুন</p>
              </div>
          )}
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-8">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium text-gray-600">
                    পাতা {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
      )}
    </div>
  );
};

export default ResultsView;