import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEAT_AREAS, SEAT_INDICES } from '../constants';
import { CANDIDATES } from '../candidates';
import { PartyResult } from '../types';

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  upazilas: string[];
  totalVotes: number;
  isSuspended?: boolean;
  updatedAt?: any;
}

// Global cache to persist data across tab switches
let cachedWinnersData: SeatData[] | null = null;

export const useWinnersData = () => {
  const [data, setData] = useState<SeatData[]>(cachedWinnersData || []);
  const [loading, setLoading] = useState(!cachedWinnersData);

  // Filters
  const [filterParty, setFilterParty] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'suspended' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle State for Pending Card Details (Optional secondary view)
  const [showLeading, setShowLeading] = useState(false);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(20);
  const ITEMS_PER_BATCH = 20;

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!cachedWinnersData) {
        setLoading(true);
      }
      
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const fetchedData: SeatData[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          fetchedData.push({
            seatNo: d.seatNo || '',
            division: d.division || '',
            district: d.district || '',
            results: Array.isArray(d.results) ? d.results.map((r: any) => ({
              party: r.party,
              votes: r.votes,
              candidate: r.candidate,
              isDeclaredWinner: r.isDeclaredWinner
            })) : [],
            upazilas: d.upazilas || [],
            totalVotes: d.totalVotes || 0,
            isSuspended: !!d.isSuspended,
            updatedAt: d.updatedAt && d.updatedAt.seconds ? { seconds: d.updatedAt.seconds } : null
          });
        });
        
        cachedWinnersData = fetchedData;
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Logic for WINNERS List
  const filteredWinners = useMemo(() => {
    const list: any[] = [];

    data.forEach(seat => {
        const winner = seat.results.find(r => r.isDeclaredWinner);
        const isSuspended = seat.isSuspended;
        const isPending = !winner && !isSuspended;

        // Determine Status for this seat
        let status = 'pending';
        if (isSuspended) status = 'suspended';
        else if (winner) status = 'declared';

        // Prepare row data (even if no winner, we might need to show it for pending/suspended view)
        // If suspended, we still show the winner party name if one was declared previously, otherwise "Suspended"
        let displayParty = winner ? winner.party : (isSuspended ? 'স্থগিত' : 'ফলাফল অপেক্ষমান');
        let displayVotes = winner ? winner.votes : 0;
        let displayCandidate = winner ? (winner.candidate || CANDIDATES[seat.seatNo]?.[winner.party]) : '';

        // If pending, maybe show leading party?
        if (isPending && seat.results.length > 0) {
            const sorted = [...seat.results].sort((a,b) => b.votes - a.votes);
            if (sorted[0] && sorted[0].votes > 0) {
                displayParty = `${sorted[0].party} (এগিয়ে)`;
                displayVotes = sorted[0].votes;
                displayCandidate = sorted[0].candidate || CANDIDATES[seat.seatNo]?.[sorted[0].party];
            }
        }

        list.push({
            seatNo: seat.seatNo,
            seatIndex: SEAT_INDICES[seat.seatNo],
            division: seat.division,
            district: seat.district,
            party: displayParty, // Used for display and filtering
            realParty: winner?.party, // Used for strict party filtering
            candidate: displayCandidate,
            votes: displayVotes,
            isDeclaredWinner: !!winner,
            isSuspended: isSuspended,
            isPending: isPending,
            areaDescription: SEAT_AREAS[seat.seatNo]?.join(', ') || ''
        });
    });

    return list
      .filter(item => {
        // 1. Search Filter
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

        // 2. Status Filter (from Cards)
        if (filterStatus === 'suspended') {
            return item.isSuspended;
        }
        if (filterStatus === 'pending') {
            return item.isPending;
        }

        // 3. Party Filter (from Dropdown or Cards)
        if (filterParty) {
            // Show declared winners OR suspended seats if the winning party matches
            // If item is suspended but has a realParty (winner declared then suspended), we match that.
            if (item.realParty === filterParty) return true;
            
            // Strict match for non-suspended
            return item.isDeclaredWinner && item.realParty === filterParty;
        }

        // Default: Show declared winners OR suspended seats
        return item.isDeclaredWinner || item.isSuspended;
      })
      .sort((a, b) => {
         // Suspended items first if mixed? Or just index sort. Let's do index sort.
         const indexA = a.seatIndex || 9999;
         const indexB = b.seatIndex || 9999;
         if (indexA !== indexB) {
             return indexA - indexB;
         }
         return a.seatNo.localeCompare(b.seatNo, 'bn', { numeric: true });
      });
  }, [data, filterParty, filterStatus, searchTerm]);

  // Stats Calculations
  const generalStats = useMemo(() => {
      let suspendedCount = 0;
      let declaredCount = 0;
      data.forEach(seat => {
          if (seat.isSuspended) suspendedCount++;
          else if (seat.results.some(r => r.isDeclaredWinner)) declaredCount++;
      });
      const totalSeats = data.length > 0 ? data.length : 300; 
      const pendingCount = totalSeats - declaredCount - suspendedCount;
      return { suspendedCount, pendingCount, totalSeats };
  }, [data]);

  const winningPartyStats = useMemo(() => {
    const stats: Record<string, number> = {
        'বিএনপি': 0, 'জামায়াতে ইসলামী': 0, 'এনসিপি': 0, 'স্বতন্ত্র': 0
    };
    data.forEach(seat => {
        // Only count towards stats if NOT suspended
        if (!seat.isSuspended) {
            const winner = seat.results.find(r => r.isDeclaredWinner);
            if (winner) {
                stats[winner.party] = (stats[winner.party] || 0) + 1;
            }
        }
    });
    return stats;
  }, [data]);

  const leadingPendingStats = useMemo(() => {
      const stats: Record<string, number> = {};
      data.forEach(seat => {
          if (!seat.isSuspended && !seat.results.some(r => r.isDeclaredWinner)) {
              if (seat.results.length > 0) {
                  const sorted = [...seat.results].sort((a, b) => b.votes - a.votes);
                  const leader = sorted[0];
                  if (leader && leader.votes > 0) {
                      stats[leader.party] = (stats[leader.party] || 0) + 1;
                  }
              }
          }
      });
      return stats;
  }, [data]);

  // Infinite Scroll Logic
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [filterParty, searchTerm, filterStatus]);

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_BATCH);
  };

  const currentItems = filteredWinners.slice(0, visibleCount);
  const hasMore = visibleCount < filteredWinners.length;

  // Actions
  const handleResetFilters = () => {
    setFilterParty('');
    setFilterStatus('all');
    setSearchTerm('');
  };

  const handleCardClick = (type: 'party' | 'suspended' | 'pending', value?: string) => {
      // If clicking the same filter, reset it
      if (type === 'party' && value === filterParty) {
          setFilterParty('');
          setFilterStatus('all');
      } else if (type === 'suspended' && filterStatus === 'suspended') {
          setFilterStatus('all');
      } else if (type === 'pending' && filterStatus === 'pending') {
          setFilterStatus('all');
      } else {
          // Apply new filter
          if (type === 'party' && value) {
              setFilterParty(value);
              setFilterStatus('all');
          } else if (type === 'suspended') {
              setFilterStatus('suspended');
              setFilterParty('');
          } else if (type === 'pending') {
              setFilterStatus('pending');
              setFilterParty('');
          }
      }
  };

  const handleToggleWinner = async (seatNo: string, partyName: string, currentStatus: boolean) => {
    // Logic remains same...
    const updatedData = data.map(seat => {
      if (seat.seatNo === seatNo) {
         const newResults = seat.results.map(r => {
           if (r.party === partyName) return { ...r, isDeclaredWinner: !currentStatus };
           return r;
         });
         return { ...seat, results: newResults };
      }
      return seat;
    });
    setData(updatedData);
    cachedWinnersData = updatedData;

    try {
      const seatRef = doc(db, "seats", seatNo);
      const seatSnap = await getDoc(seatRef);
      if (seatSnap.exists()) {
        const seatData = seatSnap.data() as SeatData;
        const updatedResults = seatData.results.map(r => {
             if (r.party === partyName) return { ...r, isDeclaredWinner: !currentStatus };
             return r;
        });
        await updateDoc(seatRef, { results: updatedResults, updatedAt: serverTimestamp() });
      }
    } catch (e) {
      console.error("Error updating winner:", e);
    }
  };

  const downloadReport = () => {
    if (filteredWinners.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }
    const now = new Date();
    let content = "শ্রদ্ধেয় জেনারেল\nআসসালামু আলাইকুম স্যার,\n\n*চূড়ান্ত বিজয়ী তালিকা*\n";
    content += `তারিখ: ${now.toLocaleDateString('bn-BD')}, ${now.toLocaleTimeString('bn-BD')}\n===============================\n\n`;

    filteredWinners.forEach((winner, index) => {
        const serial = (index + 1).toLocaleString('bn-BD');
        const candidateInfo = winner.candidate ? ` (${winner.candidate})` : "";
        let statusText = "";
        if (winner.isSuspended) statusText = " [স্থগিত]";
        
        content += `${serial}। আসন: ${winner.seatNo}, দল: ${winner.party}${candidateInfo}, ভোট: ${winner.votes.toLocaleString('bn-BD')}${statusText}\n`;
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

  return {
    loading, 
    filterParty, setFilterParty, 
    filterStatus,
    searchTerm, setSearchTerm,
    filteredWinners, currentItems, hasMore, loadMore,
    winningPartyStats, generalStats, leadingPendingStats,
    showLeading, setShowLeading,
    handleResetFilters, downloadReport, handleToggleWinner,
    handleCardClick
  };
};