import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { LOCATION_DATA, SEAT_DATA, SEAT_INDICES, SEAT_AREAS, PARTY_COLORS, PARTIES } from '../constants';
import { DashboardSeatData, PartyResult } from '../types';

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardSeatData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'suspended' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [showLeading, setShowLeading] = useState(false);
  const [viewingSeat, setViewingSeat] = useState('');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const fetchedData: DashboardSeatData[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          // Deep sanitize results array to avoid circular references
          const sanitizedResults = Array.isArray(d.results) 
            ? d.results.map((r: any) => ({
                party: r.party || '',
                votes: Number(r.votes) || 0,
                candidate: r.candidate || '',
                isDeclaredWinner: !!r.isDeclaredWinner
              }))
            : [];

          fetchedData.push({
            seatNo: d.seatNo || '',
            division: d.division || '',
            district: d.district || '',
            results: sanitizedResults,
            totalVotes: Number(d.totalVotes) || 0,
            isSuspended: !!d.isSuspended,
            updatedAt: d.updatedAt ? { seconds: d.updatedAt.seconds } : null
          });
        });
        setData(fetchedData);
      } catch (error: any) {
        console.error("Error fetching data:", error?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync viewingSeat with filterSeat
  useEffect(() => {
    if (filterSeat) {
      setViewingSeat(filterSeat);
    }
  }, [filterSeat]);

  useEffect(() => {
    if (!filterDistrict) {
      setViewingSeat('');
    }
  }, [filterDistrict]);

  const activeSeat = filterSeat || (filterDistrict ? viewingSeat : '');

  // Calculate dynamic list of available parties
  const availableParties = useMemo(() => {
    const set = new Set(PARTIES);
    data.forEach(seat => {
        seat.results.forEach(r => set.add(r.party));
    });
    return Array.from(set).sort();
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      
      // Status Filter logic
      if (filterStatus === 'suspended' && !item.isSuspended) return false;
      
      // For pending filter, we need to check if declared
      if (filterStatus === 'pending') {
          const isSuspended = item.isSuspended;
          const isDeclared = item.results.some(r => r.isDeclaredWinner);
          if (isDeclared || isSuspended) return false;
      }

      return true;
    });
  }, [data, filterDivision, filterDistrict, filterStatus]);

  // General Stats for Cards (Winning, Suspended, Pending)
  const cardStats = useMemo(() => {
      let suspendedCount = 0;
      let declaredCount = 0;
      
      const winningStats: Record<string, number> = {
        'বিএনপি': 0, 'জামায়াতে ইসলামী': 0, 'এনসিপি': 0, 'স্বতন্ত্র': 0
      };

      const leadingPendingStats: Record<string, number> = {};

      data.forEach(seat => {
          if (seat.isSuspended) {
              suspendedCount++;
          } else {
              const winner = seat.results.find(r => r.isDeclaredWinner);
              if (winner) {
                  declaredCount++;
                  winningStats[winner.party] = (winningStats[winner.party] || 0) + 1;
              } else if (seat.results.length > 0) {
                  // Calculate leading for pending
                  const sorted = [...seat.results].sort((a,b) => b.votes - a.votes);
                  const leader = sorted[0];
                  if (leader && leader.votes > 0) {
                      leadingPendingStats[leader.party] = (leadingPendingStats[leader.party] || 0) + 1;
                  }
              }
          }
      });

      const totalSeats = data.length > 0 ? data.length : 300;
      const pendingCount = totalSeats - declaredCount - suspendedCount;

      return { winningStats, suspendedCount, pendingCount, leadingPendingStats };
  }, [data]);


  // Ticker Items
  const tickerItems = useMemo(() => {
    const items: string[] = [];
    filteredData.forEach((seat: any) => {
        if (seat.isSuspended) {
             items.push(`⚠️ ${seat.seatNo}: এই আসনের নির্বাচন স্থগিত ঘোষণা করা হয়েছে`);
             return;
        }
        const winner = seat.results.find((r: any) => r.isDeclaredWinner);
        const seatIdx = SEAT_INDICES[seat.seatNo];
        const indexStr = seatIdx ? `(${seatIdx})` : '';
        
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

  // Statistics Calculation for Charts & Tables
  const stats = useMemo(() => {
    // Single Seat Logic
    if (filterSeat && filteredData.length > 0) {
        const seat = filteredData.find(s => s.seatNo === filterSeat);
        if (seat) {
            const barData = seat.results
                .filter(r => r.votes > 0 || r.isDeclaredWinner)
                .map(r => ({ 
                    name: r.party, 
                    votes: r.votes, 
                    isDeclaredWinner: r.isDeclaredWinner 
                }))
                .sort((a, b) => b.votes - a.votes);

            return {
                isSingleSeat: true,
                seatNo: seat.seatNo,
                barData,
                totalVotesCast: seat.totalVotes || 0,
                maxVotes: Math.max(...barData.map(d => d.votes), 0),
                pieData: [],
                totalSeats: 1, declaredSeats: 0, pendingSeats: 0, leadingParty: '', maxWins: 0, partyBreakdown: [], partyTableData: []
            };
        }
    }

    // Aggregate Logic
    let totalSeats = 0;
    if (filterDistrict) {
       totalSeats = SEAT_DATA[filterDistrict]?.length || 0;
    } else if (filterDivision) {
       const dists = Object.keys(LOCATION_DATA[filterDivision] || {});
       totalSeats = dists.reduce((acc, d) => acc + (SEAT_DATA[d]?.length || 0), 0);
    } else {
       totalSeats = 300; 
    }

    let declaredSeats = 0;
    let totalVotesCast = 0;
    const partyWins: Record<string, number> = {};
    const partyVotes: Record<string, number> = {};
    
    PARTIES.forEach(p => { partyWins[p] = 0; partyVotes[p] = 0; });

    filteredData.forEach((seat: any) => {
        if (seat.isSuspended) return; // Skip suspended in general stats

        totalVotesCast += seat.totalVotes || 0;
        seat.results.forEach((r: any) => {
            if (!filterParty || r.party === filterParty) {
                partyVotes[r.party] = (partyVotes[r.party] || 0) + r.votes;
            }
        });
        const declaredWinner = seat.results.find((r: any) => r.isDeclaredWinner);
        if (declaredWinner) {
            if (!filterParty || declaredWinner.party === filterParty) {
                partyWins[declaredWinner.party] = (partyWins[declaredWinner.party] || 0) + 1;
                declaredSeats++;
            }
        }
    });

    let leadingParty = "N/A";
    let maxWins = -1;
    Object.entries(partyWins).forEach(([p, w]) => {
        if (w > maxWins) { maxWins = w; leadingParty = p; }
    });

    const pieData = Object.entries(partyWins)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const partyBreakdown = Object.entries(partyWins)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
            name,
            count: value,
            color: PARTY_COLORS[name] || PARTY_COLORS['default']
        }))
        .sort((a, b) => b.count - a.count);

    const barData = Object.entries(partyVotes)
        .filter(([, votes]) => votes > 0)
        .map(([name, votes]) => ({ name, votes }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5); 

    const partyTableData = Object.keys(partyWins)
        .filter(p => partyWins[p] > 0 || partyVotes[p] > 0)
        .map(party => ({
            name: party,
            wins: partyWins[party] || 0,
            votes: partyVotes[party] || 0
        }))
        .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.votes - a.votes;
        });

    return {
        isSingleSeat: false,
        totalSeats,
        declaredSeats,
        pendingSeats: Math.max(0, totalSeats - declaredSeats),
        totalVotesCast,
        leadingParty,
        maxWins,
        pieData,
        barData,
        partyBreakdown,
        partyTableData
    };
  }, [filteredData, filterDivision, filterDistrict, filterSeat, filterParty]);

  // Drill Down Data
  const drillDownData = useMemo(() => {
      if (filterSeat) return [];

      const rows: any[] = [];

      // Helper to check if a row should be included based on filters
      const shouldInclude = (leader: string, count: number) => {
          if (filterStatus === 'suspended') {
              return count > 0;
          }
          if (filterParty && leader !== filterParty && !leader.includes(filterParty) && leader !== '-') return false;
          return true;
      };

      if (filterDistrict) {
          // SEAT LEVEL VIEW (Inside a District)
          const seatsInDistrict = SEAT_DATA[filterDistrict] || [];
          seatsInDistrict.forEach(seatName => {
              const seatInfo = data.find(d => d.seatNo === seatName);
              let leader = "-";
              let isDec = 0;
              // @ts-ignore
              const isSuspended = seatInfo?.isSuspended;
              
              if (seatInfo) {
                  if (isSuspended) {
                      leader = "স্থগিত";
                      // If filtering by suspended, this "counts" as a hit
                      if (filterStatus === 'suspended') isDec = 1;
                  } else {
                      const declaredWinner = seatInfo.results.find(r => r.isDeclaredWinner);
                      if (declaredWinner) {
                          leader = declaredWinner.party;
                          isDec = 1;
                      } else if (seatInfo.results.length > 0) {
                          const sorted = [...seatInfo.results].sort((a,b) => b.votes - a.votes);
                          if(sorted[0] && sorted[0].votes > 0) leader = `${sorted[0].party} (এগিয়ে)`;
                      }
                  }
              }

              // Filter Logic
              if (filterStatus === 'suspended') {
                  if (!isSuspended) return;
              } else if (filterParty) {
                  if (leader !== filterParty && !leader.includes(filterParty) && leader !== '-') return;
              }

              rows.push({ 
                  name: seatName, 
                  type: 'seat',
                  total: 1, 
                  declared: isDec, 
                  leader,
                  seatIndex: SEAT_INDICES[seatName]
              });
          });
      } else if (filterDivision) {
          // DISTRICT LEVEL VIEW (Inside a Division)
          const dists = Object.keys(LOCATION_DATA[filterDivision] || {});
          dists.forEach(distName => {
              const seatsInDist = SEAT_DATA[distName] || [];
              const distTotal = seatsInDist.length;
              let relevantCount = 0;
              let leader = "-";

              if (filterStatus === 'suspended') {
                  // Count suspended seats in this district
                  relevantCount = data.filter(d => d.district === distName && d.isSuspended).length;
                  if (relevantCount > 0) leader = "স্থগিত";
              } else {
                  // Normal Winner/Leading Logic
                  const divWins: Record<string, number> = {};
                  data.filter(d => d.district === distName).forEach(seat => {
                      if(seat.isSuspended) return;
                      const declaredWinner = seat.results.find(r => r.isDeclaredWinner);
                      if (declaredWinner) {
                          if (!filterParty || declaredWinner.party === filterParty) {
                              relevantCount++;
                              divWins[declaredWinner.party] = (divWins[declaredWinner.party] || 0) + 1;
                          }
                      }
                  });
                  let max = -1;
                  Object.entries(divWins).forEach(([p, w]) => { if(w>max){ max=w; leader=p } });
                  if (leader === "-") leader = "অপেক্ষমান";
              }

              if (shouldInclude(leader, relevantCount) || (filterStatus !== 'suspended' && !filterParty)) {
                   rows.push({ name: distName, type: 'district', total: distTotal, declared: relevantCount, leader });
              }
          });
      } else {
          // DIVISION LEVEL VIEW (All Divisions)
          Object.keys(LOCATION_DATA).forEach(divName => {
              const dists = Object.keys(LOCATION_DATA[divName]);
              const divTotal = dists.reduce((acc, d) => acc + (SEAT_DATA[d]?.length || 0), 0);
              let relevantCount = 0;
              let leader = "-";

              if (filterStatus === 'suspended') {
                  // Count suspended seats in this division
                  relevantCount = data.filter(d => d.division === divName && d.isSuspended).length;
                  if (relevantCount > 0) leader = "স্থগিত";
              } else {
                  // Normal Winner/Leading Logic
                  const divWins: Record<string, number> = {};
                  data.filter(d => d.division === divName).forEach(seat => {
                      if(seat.isSuspended) return;
                      const declaredWinner = seat.results.find(r => r.isDeclaredWinner);
                      if (declaredWinner) {
                          if (!filterParty || declaredWinner.party === filterParty) {
                              relevantCount++;
                              divWins[declaredWinner.party] = (divWins[declaredWinner.party] || 0) + 1;
                          }
                      }
                  });
                  let max = -1;
                  Object.entries(divWins).forEach(([p, w]) => { if(w>max){ max=w; leader=p } });
                  if (leader === "-") leader = "অপেক্ষমান";
              }

              if (shouldInclude(leader, relevantCount) || (filterStatus !== 'suspended' && !filterParty)) {
                  rows.push({ name: divName, type: 'division', total: divTotal, declared: relevantCount, leader });
              }
          });
      }
      return rows;
  }, [data, filterDivision, filterDistrict, filterParty, filterSeat, filterStatus]);

  // Info List Data
  const allSeatsInfo = useMemo(() => {
      const list: any[] = [];
      const distToDiv: Record<string, string> = {};
      Object.keys(LOCATION_DATA).forEach(div => {
          Object.keys(LOCATION_DATA[div]).forEach(dist => {
              distToDiv[dist] = div;
          });
      });

      Object.keys(SEAT_DATA).forEach(dist => {
          const seats = SEAT_DATA[dist];
          const div = distToDiv[dist] || 'Unknown';
          seats.forEach(seat => {
              list.push({
                  seatNo: seat,
                  division: div,
                  district: dist,
                  seatIndex: SEAT_INDICES[seat] || 0,
                  areas: SEAT_AREAS[seat] || []
              });
          });
      });
      return list.sort((a, b) => (a.seatIndex || 999) - (b.seatIndex || 999));
  }, []);

  const visibleInfoList = useMemo(() => {
      const liveDataMap: Record<string, any> = {};
      data.forEach(seat => {
          const winner = seat.results.find(r => r.isDeclaredWinner);
          liveDataMap[seat.seatNo] = {
              winner,
              isSuspended: seat.isSuspended
          };
      });

      return allSeatsInfo.filter(item => {
          if (filterDivision && item.division !== filterDivision) return false;
          if (filterDistrict && item.district !== filterDistrict) return false;
          
          if (filterParty) {
              const info = liveDataMap[item.seatNo];
              if (!info?.winner || info.winner.party !== filterParty) return false;
          }

          if (searchTerm) {
              const term = searchTerm.toLowerCase();
              const matches = 
                  item.seatNo.toLowerCase().includes(term) ||
                  item.district.toLowerCase().includes(term) ||
                  item.division.toLowerCase().includes(term) ||
                  item.areas.some((a: string) => a.toLowerCase().includes(term)) ||
                  item.seatIndex.toString().includes(term);
              if (!matches) return false;
          }

          // New: Filter by status (suspended/pending) in Info List
          const info = liveDataMap[item.seatNo];
          const isSuspended = info?.isSuspended;
          const isDeclared = !!info?.winner;

          if (filterStatus === 'suspended' && !isSuspended) return false;
          if (filterStatus === 'pending' && (isDeclared || isSuspended)) return false;

          return true;
      }).map(item => ({
          ...item,
          winner: liveDataMap[item.seatNo]?.winner,
          isSuspended: liveDataMap[item.seatNo]?.isSuspended
      }));
  }, [allSeatsInfo, data, filterDivision, filterDistrict, filterParty, searchTerm, filterStatus]);

  // Helpers
  const handleResetFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
    setFilterStatus('all');
    setSearchTerm('');
    setViewingSeat('');
  };

  const handleCardClick = (type: 'party' | 'suspended' | 'pending', value?: string) => {
      // Toggle logic
      if (type === 'party' && value === filterParty) {
          setFilterParty('');
          setFilterStatus('all');
      } else if (type === 'suspended' && filterStatus === 'suspended') {
          setFilterStatus('all');
      } else if (type === 'pending' && filterStatus === 'pending') {
          setFilterStatus('all');
      } else {
          // Apply Logic
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

  const handleRowClick = (row: any) => {
      if (row.type === 'division') {
          setFilterDivision(row.name);
          setFilterDistrict('');
      } else if (row.type === 'district') {
          setFilterDistrict(row.name);
      } else if (row.type === 'seat') {
          setFilterSeat(row.name);
      }
  };

  const handleDrillDownBack = () => {
      if (filterDistrict) {
          setFilterDistrict('');
      } else if (filterDivision) {
          setFilterDivision('');
      }
  };

  // Selected Seat Logic
  const selectedSeatInfo = useMemo(() => {
      if (!activeSeat) return null;
      return allSeatsInfo.find(s => s.seatNo === activeSeat);
  }, [allSeatsInfo, activeSeat]);

  const selectedSeatData = useMemo(() => {
      if (!activeSeat) return null;
      return data.find(s => s.seatNo === activeSeat);
  }, [data, activeSeat]);

  return {
    data, loading,
    filters: { division: filterDivision, district: filterDistrict, seat: filterSeat, party: filterParty, search: searchTerm },
    setFilters: { setDivision: setFilterDivision, setDistrict: setFilterDistrict, setSeat: setFilterSeat, setParty: setFilterParty, setSearch: setSearchTerm },
    handleResetFilters,
    handleCardClick,
    availableParties,
    activeSeat,
    viewingSeat,
    setViewingSeat,
    
    // Stats & Data
    stats,
    cardStats,
    showLeading, setShowLeading,
    drillDownData,
    visibleInfoList,
    handleRowClick,
    handleDrillDownBack,
    
    // Detail Data
    selectedSeatInfo,
    selectedSeatData,
    tickerItems
  };
};