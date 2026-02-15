import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { LOCATION_DATA, SEAT_DATA, SEAT_AREAS, SEAT_INDICES, PARTIES } from '../constants';
import { CANDIDATES } from '../candidates';

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
  updatedAt?: any;
  isSuspended?: boolean;
}

const MANDATORY_PARTIES = ["বিএনপি", "জামায়াতে ইসলামী", "এনসিপি", "স্বতন্ত্র"];

export const useResultsData = (isAdminMode: boolean) => {
  const [dbData, setDbData] = useState<Record<string, SeatData>>({});
  const [recentSeatNos, setRecentSeatNos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed local isAdminMode state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  
  // Modals State
  const [confirmModalData, setConfirmModalData] = useState<{
    seatNo: string;
    party: string;
    oldParty?: string;
    division: string;
    district: string;
    action: 'declare' | 'revoke' | 'switch';
  } | null>(null);

  const [suspendModalData, setSuspendModalData] = useState<{
    seatNo: string;
    currentStatus: boolean;
  } | null>(null);

  // Filters
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_BATCH = 20;

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const dataMap: Record<string, SeatData> = {};
        const fetchedList: SeatData[] = [];

        querySnapshot.forEach((doc) => {
          const d = doc.data() as SeatData;
          // Explicitly map fields to avoid circular references from unknown properties
          const sanitized: SeatData = {
            seatNo: d.seatNo,
            division: d.division,
            district: d.district,
            results: d.results || [],
            upazilas: d.upazilas || [],
            totalVotes: d.totalVotes || 0,
            isSuspended: !!d.isSuspended,
            updatedAt: d.updatedAt ? { seconds: d.updatedAt.seconds } : null
          };
          dataMap[d.seatNo] = sanitized;
          fetchedList.push(sanitized);
        });

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

  // Prepare Master List
  const mergedData = useMemo(() => {
    const list: any[] = [];
    Object.keys(SEAT_DATA).forEach(dist => {
      // Find division for this district
      let div = '';
      for (const d in LOCATION_DATA) {
          if (LOCATION_DATA[d][dist]) {
              div = d;
              break;
          }
      }
      
      SEAT_DATA[dist].forEach(s => {
        const dbEntry = dbData[s];
        list.push({
          seatNo: s,
          district: dist,
          division: div,
          seatIndex: SEAT_INDICES[s],
          results: dbEntry?.results || [],
          upazilas: dbEntry?.upazilas || [],
          totalVotes: dbEntry?.totalVotes || 0,
          updatedAt: dbEntry?.updatedAt,
          hasDbEntry: !!dbEntry,
          isSuspended: dbEntry?.isSuspended || false,
          areaDescription: SEAT_AREAS[s]?.join(', ') || ''
        });
      });
    });
    return list;
  }, [dbData]);

  // Derived Data (Parties)
  const allParties = useMemo(() => {
    const uniqueParties = new Set(PARTIES); 
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
            item.results.some((r: any) => r.party.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      if (filterSeat && item.seatNo !== filterSeat) return false;
      
      if (filterParty) {
         const isMandatory = MANDATORY_PARTIES.includes(filterParty);
         const hasResult = item.results.some((r: any) => r.party === filterParty);
         if (!isMandatory && !hasResult) return false;
      }

      return true;
    });
  }, [mergedData, filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

  // Enriched Data with Pre-calculated Stats
  const enrichedData = useMemo(() => {
    return filteredData.map(seat => {
       const totalVotes = seat.results.reduce((sum: number, r: any) => sum + r.votes, 0);
       const maxVotes = Math.max(...seat.results.map((r: any) => r.votes), 0);
       const declaredWinner = seat.results.find((r: any) => r.isDeclaredWinner);
       
       const voteLeader = totalVotes > 0 
          ? seat.results.reduce((p: any, c: any) => (p.votes > c.votes ? p : c), seat.results[0]) 
          : null;
       
       const leadingResult = declaredWinner || (voteLeader && voteLeader.votes > 0 ? voteLeader : null);

       return {
         ...seat,
         stats: {
           totalVotes,
           maxVotes,
           leadingResult,
           isDeclared: !!declaredWinner
         }
       };
    });
  }, [filteredData]);

  // Reset infinite scroll when filters change
  useEffect(() => { 
    setVisibleCount(ITEMS_PER_BATCH); 
  }, [filterDivision, filterDistrict, filterSeat, filterParty, searchTerm]);

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_BATCH);
  };

  const currentItems = enrichedData.slice(0, visibleCount);
  const hasMore = visibleCount < enrichedData.length;

  // Actions
  const handleResetFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
    setSearchTerm('');
  };

  const handleDeleteResult = async (seatNo: string, partyName: string) => {
    if (!isAdminMode) return;
    if (!window.confirm(`আপনি কি নিশ্চিত যে আপনি ${seatNo} আসন থেকে ${partyName}-এর ফলাফল মুছে ফেলতে চান?`)) return;

    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);

      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        const updatedResults = seatData.results.filter(r => r.party !== partyName);
        const newTotalVotes = updatedResults.reduce((sum, r) => sum + r.votes, 0);

        await updateDoc(seatRef, { results: updatedResults, totalVotes: newTotalVotes });

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

  // Trigger Suspend Modal
  const handleToggleSuspended = (seatNo: string, currentStatus: boolean) => {
    if (!isAdminMode) return;
    setSuspendModalData({ seatNo, currentStatus });
  };

  // Execute Suspend Action
  const confirmToggleSuspended = async () => {
    if (!suspendModalData) return;
    const { seatNo, currentStatus } = suspendModalData;
    const isSuspending = !currentStatus;

    try {
        const seatRef = doc(db, "seats", seatNo);
        await setDoc(seatRef, { seatNo: seatNo, isSuspended: isSuspending }, { merge: true });

        setDbData(prev => ({
            ...prev,
            [seatNo]: {
                ...prev[seatNo],
                seatNo, 
                // Explicitly set fields to avoid spreading
                division: prev[seatNo]?.division || '',
                district: prev[seatNo]?.district || '',
                results: prev[seatNo]?.results || [],
                upazilas: prev[seatNo]?.upazilas || [],
                totalVotes: prev[seatNo]?.totalVotes || 0,
                isSuspended: isSuspending,
                updatedAt: { seconds: Math.floor(Date.now() / 1000) }
            }
        }));
    } catch (error) {
        console.error("Error toggling suspension:", error);
        alert("আপডেট করতে সমস্যা হয়েছে।");
    } finally {
        setSuspendModalData(null);
    }
  };

  const executeWinnerUpdate = async (seatNo: string, partyName: string, shouldBeWinner: boolean, division: string, district: string) => {
    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);
      
      let updatedResults: PartyResult[] = [];
      let newTotalVotes = 0;

      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        updatedResults = seatData.results.map(r => {
            if (r.party === partyName) return { ...r, isDeclaredWinner: shouldBeWinner };
            if (shouldBeWinner) return { ...r, isDeclaredWinner: false }; // Unset others if new winner declared
            return r;
        });

        // Add party if not exists and we are declaring winner
        if (!seatData.results.find(r => r.party === partyName) && shouldBeWinner) {
             updatedResults.push({
                party: partyName,
                votes: 0,
                candidate: CANDIDATES[seatNo]?.[partyName] || '',
                isDeclaredWinner: shouldBeWinner
             });
        }
        newTotalVotes = seatData.totalVotes; 
      } else {
        // Create doc
        updatedResults = [{
          party: partyName,
          votes: 0,
          candidate: CANDIDATES[seatNo]?.[partyName] || '',
          isDeclaredWinner: shouldBeWinner
        }];
        newTotalVotes = 0;
      }

      await setDoc(seatRef, {
        seatNo, division, district, results: updatedResults, totalVotes: newTotalVotes, isSuspended: false, updatedAt: serverTimestamp()
      }, { merge: true });

      setDbData(prev => ({
        ...prev,
        [seatNo]: {
            ...prev[seatNo],
            seatNo, division, district, results: updatedResults, totalVotes: newTotalVotes, isSuspended: false, updatedAt: { seconds: Math.floor(Date.now() / 1000) }
        }
      }));
    } catch (error) {
      console.error("Error toggling winner:", error);
      alert("আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  // Trigger Winner Modal
  const handleToggleWinner = (seatNo: string, partyName: string, currentStatus: boolean, division: string, district: string) => {
    if (!isAdminMode) return;

    if (currentStatus) {
        // Currently a winner, so user wants to revoke
        setConfirmModalData({
            seatNo,
            party: partyName,
            division,
            district,
            action: 'revoke'
        });
        return;
    }

    // Currently NOT a winner, user wants to declare
    const seat = dbData[seatNo];
    const existingWinner = seat?.results?.find(r => r.isDeclaredWinner);

    if (existingWinner && existingWinner.party !== partyName) {
        // Switch winner from old to new
        setConfirmModalData({ 
            seatNo, 
            party: partyName, 
            oldParty: existingWinner.party, 
            division, 
            district,
            action: 'switch'
        });
    } else {
        // Fresh declaration or re-declaration
        setConfirmModalData({ 
            seatNo, 
            party: partyName, 
            division, 
            district,
            action: 'declare'
        });
    }
  };

  const confirmChangeWinner = () => {
      if (confirmModalData) {
          const { seatNo, party, action, division, district } = confirmModalData;
          // If action is revoke, shouldBeWinner is false. Otherwise true.
          const shouldBeWinner = action !== 'revoke';
          executeWinnerUpdate(seatNo, party, shouldBeWinner, division, district);
          setConfirmModalData(null);
      }
  };

  const handleDeleteAll = async () => {
    if (!isAdminMode) return;
    if (Object.keys(dbData).length === 0) { alert("মুছে ফেলার মতো কোনো ডাটা নেই।"); return; }
    if (!window.confirm("⚠️ সতর্কতা: আপনি কি ডাটাবেস থেকে **সকল আসনের** নির্বাচনী ফলাফল মুছে ফেলতে চান?")) return;

    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "seats"));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.update(doc.ref, { results: [], totalVotes: 0, isSuspended: false, updatedAt: serverTimestamp() }));
      await batch.commit();
      
      const clearedDbData: Record<string, SeatData> = {};
      Object.keys(dbData).forEach(key => {
          clearedDbData[key] = {
              ...dbData[key],
              results: [],
              totalVotes: 0,
              isSuspended: false,
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

  const downloadReport = () => {
    if (enrichedData.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }

    let content = "শ্রদ্ধেয় জেনারেল\n";
    content += "আসসালামু আলাইকুম স্যার,\n\n";
    content += "*নির্বাচনী ফলাফল রিপোর্ট*\n";
    content += `তারিখ: ${new Date().toLocaleString('bn-BD')}\n`;
    content += "===============================\n\n";

    enrichedData.forEach(seat => {
      const areaInfo = seat.areaDescription ? ` (${seat.areaDescription})` : "";
      const indexInfo = seat.seatIndex ? ` [আসন নং: ${seat.seatIndex}]` : "";
      content += `*${seat.seatNo}${indexInfo}${areaInfo}*\n`;
      content += "---------------------------------\n";

      if (seat.isSuspended) {
          content += "⚠ এই আসনের ফলাফল স্থগিত করা হয়েছে।\n\n";
          return;
      }

      let partiesToShow = [...MANDATORY_PARTIES];
      seat.results.forEach((r: any) => {
          if (!partiesToShow.includes(r.party) && r.votes > 0) {
              partiesToShow.push(r.party);
          }
      });

      if (filterParty) {
          partiesToShow = partiesToShow.filter(p => p === filterParty);
      }

      if (partiesToShow.length > 0) {
        const { maxVotes } = seat.stats;

        partiesToShow.forEach((partyName, index) => {
           const existing = seat.results.find((r: any) => r.party === partyName);
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
      } else {
          content += "ফলাফল পাওয়া যায়নি।\n\n";
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

  // Ticker Items
  const tickerItems = useMemo(() => {
    const items: string[] = [];
    filteredData.forEach(seat => {
        if (seat.isSuspended) {
             items.push(`⚠️ ${seat.seatNo}: এই আসনের নির্বাচন স্থগিত ঘোষণা করা হয়েছে`);
             return;
        }
        const winner = seat.results.find((r: any) => r.isDeclaredWinner);
        const indexStr = seat.seatIndex ? `(${seat.seatIndex})` : '';
        if (winner) {
            items.push(`🔴 ${seat.seatNo} ${indexStr}: ${winner.party} বিজয়ী (${winner.votes.toLocaleString('bn-BD')} ভোট)`);
        } else if (seat.results.length > 0) {
             const sorted = [...seat.results].sort((a:any,b:any) => b.votes - a.votes);
             if (sorted[0] && sorted[0].votes > 0) {
                 items.push(`⚪ ${seat.seatNo} ${indexStr}: ${sorted[0].party} এগিয়ে (${sorted[0].votes.toLocaleString('bn-BD')})`);
             }
        }
    });
    return items.slice(0, 15);
  }, [filteredData]);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
      const stats: Record<string, number> = {};
      let totalDeclared = 0;
      filteredData.forEach(seat => {
          if (seat.isSuspended) return; 
          const winner = seat.results.find((r:any) => r.isDeclaredWinner);
          if (winner) {
              stats[winner.party] = (stats[winner.party] || 0) + 1;
              totalDeclared++;
          }
      });
      const sortedStats = Object.entries(stats).sort(([, a], [, b]) => b - a).map(([party, wins]) => ({ party, wins }));
      return { sortedStats, totalDeclared, totalCount: filteredData.length };
  }, [filteredData]);

  return {
    dbData, recentSeatNos, loading, isAdminMode, viewMode, setViewMode,
    filters: { division: filterDivision, district: filterDistrict, seat: filterSeat, party: filterParty, search: searchTerm },
    setFilters: { setDivision: setFilterDivision, setDistrict: setFilterDistrict, setSeat: setFilterSeat, setParty: setFilterParty, setSearch: setSearchTerm },
    loadMore, hasMore, startIndex: 0, 
    filteredData: enrichedData, 
    currentItems, allParties, tickerItems, dashboardStats,
    handleResetFilters, handleDeleteResult, handleToggleSuspended, confirmToggleSuspended, handleToggleWinner, confirmChangeWinner, handleDeleteAll, downloadReport,
    confirmModalData, setConfirmModalData, suspendModalData, setSuspendModalData, MANDATORY_PARTIES
  };
};