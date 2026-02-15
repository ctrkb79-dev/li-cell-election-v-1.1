import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { PARTIES } from '../constants';
import { Download, FileText } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import SummaryStats from '../components/summary/SummaryStats';
import SummaryCharts from '../components/summary/SummaryCharts';
import SummaryList from '../components/summary/SummaryList';

interface PartyResult {
  party: string;
  votes: number;
  isDeclaredWinner?: boolean;
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  updatedAt?: any;
  isSuspended?: boolean;
}

interface PartyStats {
  party: string;
  wins: number;
  participations: number;
  totalVotes: number;
}

interface SummaryViewProps {
  onNavigateToMap?: (party: string) => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ onNavigateToMap }) => {
  const [data, setData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table');
  
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const fetchedData: SeatData[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          // Sanitize Firestore Timestamp and Suspended Status
          fetchedData.push({
            seatNo: d.seatNo,
            division: d.division,
            district: d.district,
            results: d.results,
            updatedAt: d.updatedAt ? { seconds: d.updatedAt.seconds } : null,
            // @ts-ignore
            isSuspended: !!d.isSuspended
          });
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

  const availableParties = useMemo(() => {
    const set = new Set(PARTIES);
    data.forEach(seat => {
        seat.results.forEach(r => set.add(r.party));
    });
    return Array.from(set).sort();
  }, [data]);

  const handleResetFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      if (filterSeat && item.seatNo !== filterSeat) return false;
      return true;
    });
  }, [data, filterDivision, filterDistrict, filterSeat]);

  const summaryStats = useMemo(() => {
    const stats: { [key: string]: PartyStats } = {};

    PARTIES.forEach(party => {
      stats[party] = { party, wins: 0, participations: 0, totalVotes: 0 };
    });

    filteredData.forEach(seat => {
      // Exclude suspended seats from calculation
      if (seat.isSuspended) return;
      
      if (!seat.results || seat.results.length === 0) return;

      const declaredWinner = seat.results.find(r => r.isDeclaredWinner);
      
      if (declaredWinner) {
        if (stats[declaredWinner.party]) {
          stats[declaredWinner.party].wins += 1;
        } else {
           stats[declaredWinner.party] = { party: declaredWinner.party, wins: 1, participations: 0, totalVotes: 0 };
        }
      }
      
      seat.results.forEach(r => {
        if (stats[r.party]) {
          stats[r.party].totalVotes += (r.votes || 0);
          stats[r.party].participations += 1;
        } else {
          if (!stats[r.party]) {
             stats[r.party] = { party: r.party, wins: 0, participations: 1, totalVotes: r.votes || 0 };
          } else {
             stats[r.party].totalVotes += (r.votes || 0);
             stats[r.party].participations += 1;
          }
        }
      });
    });

    let result = Object.values(stats);

    if (filterParty) {
      result = result.filter(s => s.party === filterParty);
    } 
    
    return result
      .filter(s => s.participations > 0 || s.wins > 0)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalVotes - a.totalVotes;
    });
  }, [filteredData, filterParty]);

  const topWinner = useMemo(() => {
    if (summaryStats.length === 0) return null;
    const winner = summaryStats[0];
    return winner.wins > 0 ? winner : null;
  }, [summaryStats]);

  const chartData = useMemo(() => {
     return summaryStats
       .filter(s => s.wins > 0)
       .map(s => ({
         name: s.party,
         wins: s.wins,
         votes: s.totalVotes
       }));
  }, [summaryStats]);

  const downloadSummaryReport = () => {
    if (summaryStats.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }

    let content = "শ্রদ্ধেয় জেনারেল\n";
    content += "আসসালামু আলাইকুম স্যার,\n\n";
    content += "*দলভিত্তিক ফলাফল সারসংক্ষেপ*\n";
    content += `তারিখ: ${new Date().toLocaleString('bn-BD')}\n`;
    content += "===============================\n\n";

    summaryStats.forEach((stat, index) => {
      if (stat.participations > 0 || stat.wins > 0) {
          const rank = (index + 1).toLocaleString('bn-BD');
          const wins = stat.wins.toLocaleString('bn-BD');
          content += `${rank}। ${stat.party}: বিজয়ী ${wins} টি\n`;
      }
    });

    content += "\nওআইসি, বিজিবি এলআই সেল।";

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `summary_report_${new Date().getTime()}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const downloadOfficialReport = () => {
    if (filteredData.length === 0) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই।");
      return;
    }

    const partyWins: Record<string, string[]> = {};
    
    filteredData.forEach(seat => {
        // Exclude suspended seats
        if (seat.isSuspended) return;

        if (!seat.results || seat.results.length === 0) return;
        const declaredWinner = seat.results.find(r => r.isDeclaredWinner);
        if (declaredWinner) {
            if (!partyWins[declaredWinner.party]) {
                partyWins[declaredWinner.party] = [];
            }
            partyWins[declaredWinner.party].push(seat.seatNo);
        }
    });

    const allowedParties = ["বিএনপি", "জামায়াতে ইসলামী", "এনসিপি", "স্বতন্ত্র"];
    const winningParties = Object.keys(partyWins)
        .filter(party => allowedParties.includes(party))
        .sort((a, b) => {
            return partyWins[b].length - partyWins[a].length;
        });

    if (winningParties.length === 0) {
        alert("রিপোর্টের জন্য নির্বাচিত দলগুলোর (বিএনপি, জামায়াতে ইসলামী, এনসিপি, স্বতন্ত্র) কোনো ঘোষিত বিজয়ী আসন পাওয়া যায়নি।");
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('bn-BD'); 
    const timeStr = now.toLocaleTimeString('bn-BD');

    let content = "শ্রদ্ধেয় জেনারেল\n";
    content += "আসসালামু আলাইকুম স্যার,\n";
    content += `তারিখ: ${dateStr}, ${timeStr}\n\n`;

    winningParties.forEach((party, index) => {
        const seats = partyWins[party];
        const count = seats.length.toLocaleString('bn-BD');
        const serial = (index + 1).toLocaleString('bn-BD');
        const seatList = seats.join(', ');

        content += `*${serial}। এখন পর্যন্ত নিম্নোক্ত আসন গুলোতে ${party} (জোট ব্যতীত) বিজয়ী হয়েছে: সর্বমোট-${count} টি আসন।*\n\n`;
        content += `${seatList}।\n\n`;
    });

    content += "আপনার সদয় অবগতির জন‍্য প্রেরণ করা হলো।\n\n";
    content += "শ্রদ্ধান্তে \n\n";
    content += "লেঃ কর্নেল মোঃ জুনায়েদ হোসেন, বিজিবিএম, বিজিবিএমএস\n";
    content += "ওআইসি, বিজিবি এলআই সেল।";

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `official_report_${new Date().getTime()}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <FilterBar 
        division={filterDivision} setDivision={setFilterDivision}
        district={filterDistrict} setDistrict={setFilterDistrict}
        seat={filterSeat} setSeat={setFilterSeat}
        party={filterParty} setParty={setFilterParty}
        onReset={handleResetFilters}
        title="সারাংশ ফিল্টার"
        partyOptions={availableParties}
        rightContent={
            <>
                <button
                onClick={downloadSummaryReport}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-2 rounded-lg transition-all border border-blue-200 hover:border-blue-600"
                >
                <Download size={14} />
                রিপোর্ট ডাউনলোড
                </button>
                <button
                onClick={downloadOfficialReport}
                className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-white hover:bg-green-700 px-3 py-2 rounded-lg transition-all border border-green-200 hover:border-green-700"
                >
                <FileText size={14} />
                অফিসিয়াল রিপোর্ট
                </button>
            </>
        }
      />

      <SummaryStats 
        summaryStats={summaryStats} 
        topWinner={topWinner} 
        loading={loading} 
      />

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            টেবিল ভিউ
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'charts' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            গ্রাফ ও চার্ট
          </button>
        </div>
      </div>

      {activeTab === 'charts' && (
        <SummaryCharts chartData={chartData} loading={loading} />
      )}

      {activeTab === 'table' && (
        <SummaryList 
          summaryStats={summaryStats} 
          onNavigateToMap={onNavigateToMap}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SummaryView;