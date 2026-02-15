import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { LOCATION_DATA, PARTIES, SEAT_DATA } from './constants';
import { Loader2, Filter, RotateCcw, Vote, Download, Table, BarChart3, MapPin, FileText } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PartyResult {
  party: string;
  votes: number;
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

const SummaryView: React.FC<SummaryViewProps> = ({ onNavigateToMap }) => {
  const [data, setData] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table');
  
  // Filters
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

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterDivision && item.division !== filterDivision) return false;
      if (filterDistrict && item.district !== filterDistrict) return false;
      if (filterSeat && item.seatNo !== filterSeat) return false;
      return true;
    });
  }, [data, filterDivision, filterDistrict, filterSeat]);

  // Calculation Logic
  const summaryStats = useMemo(() => {
    const stats: { [key: string]: PartyStats } = {};

    // Initialize all constant parties with 0 to ensure they appear even if 0 votes
    PARTIES.forEach(party => {
      stats[party] = { party, wins: 0, participations: 0, totalVotes: 0 };
    });

    // Process each seat
    filteredData.forEach(seat => {
      if (!seat.results || seat.results.length === 0) return;

      // Find winner of this seat
      let maxVotes = 0;
      let winnerParty = '';
      
      seat.results.forEach(r => {
        // Accumulate total votes
        if (stats[r.party]) {
          stats[r.party].totalVotes += (r.votes || 0);
          stats[r.party].participations += 1;
        } else {
          // Handle dynamic parties not in the constant list
          stats[r.party] = { party: r.party, wins: 0, participations: 1, totalVotes: r.votes || 0 };
        }

        // Determine max votes for winner calculation
        if ((r.votes || 0) > maxVotes) {
          maxVotes = r.votes;
          winnerParty = r.party;
        }
      });

      // Award win if votes > 0
      if (winnerParty && maxVotes > 0) {
        if (stats[winnerParty]) {
          stats[winnerParty].wins += 1;
        }
      }
    });

    // Convert to array
    let result = Object.values(stats);

    // Apply Party Filter if selected
    if (filterParty) {
      result = result.filter(s => s.party === filterParty);
    } 
    
    // Sort by Wins (desc), then by Total Votes
    return result.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalVotes - a.totalVotes;
    });
  }, [filteredData, filterParty]);

  // Top Winner Logic (Top 1)
  const topWinner = useMemo(() => {
    if (summaryStats.length === 0) return null;
    const winner = summaryStats[0];
    return winner.wins > 0 ? winner : null;
  }, [summaryStats]);

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
  };

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
      // Show stats for all parties that participated
      if (stat.participations > 0 || stat.wins > 0) {
          const rank = (index + 1).toLocaleString('bn-BD');
          const wins = stat.wins.toLocaleString('bn-BD');
          const losses = (stat.participations - stat.wins).toLocaleString('bn-BD');
          
          content += `${rank}। ${stat.party}: বিজয়ী ${wins} টি, পরাজিত ${losses} টি\n`;
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

    // 1. Calculate winning seats per party
    const partyWins: Record<string, string[]> = {};
    
    filteredData.forEach(seat => {
        if (!seat.results || seat.results.length === 0) return;
        
        // Find winner
        let maxVotes = 0;
        let winnerParty = '';
        
        seat.results.forEach(r => {
            if ((r.votes || 0) > maxVotes) {
                maxVotes = r.votes;
                winnerParty = r.party;
            }
        });

        if (winnerParty && maxVotes > 0) {
            if (!partyWins[winnerParty]) {
                partyWins[winnerParty] = [];
            }
            partyWins[winnerParty].push(seat.seatNo);
        }
    });

    // Filter for allowed parties only
    const allowedParties = ["বিএনপি", "জামায়াতে ইসলামী", "এনসিপি", "স্বতন্ত্র"];
    const winningParties = Object.keys(partyWins)
        .filter(party => allowedParties.includes(party))
        .sort((a, b) => {
            return partyWins[b].length - partyWins[a].length;
        });

    if (winningParties.length === 0) {
        alert("রিপোর্টের জন্য নির্বাচিত দলগুলোর (বিএনপি, জামায়াতে ইসলামী, এনসিপি, স্বতন্ত্র) কোনো বিজয়ী আসন পাওয়া যায়নি।");
        return;
    }

    // 2. Build Content
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

        content += `*${serial}। এখন পর্যন্ত নিম্নোক্ত আসন গুলোতে বেশী ভোটে ${party} (জোট ব্যতীত) এগিয়ে আছে: সর্বমোট-${count} টি আসন।*\n\n`;
        content += `${seatList}।\n\n`;
    });

    content += "আপনার সদয় অবগতির জন‍্য প্রেরণ করা হলো।\n\n";
    content += "শ্রদ্ধান্তে \n\n";
    content += "লেঃ কর্নেল মোঃ জুনায়েদ হোসেন, বিজিবিএম, বিজিবিএমএস\n";
    content += "ওআইসি, বিজিবি এলআই সেল।";

    // 3. Download
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `official_report_${new Date().getTime()}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  // Prepare Chart Data
  const chartData = useMemo(() => {
     return summaryStats
       .filter(s => s.wins > 0)
       .map(s => ({
         name: s.party,
         wins: s.wins,
         votes: s.totalVotes
       }));
  }, [summaryStats]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Filter size={18} />
            ফিল্টার অপশন
          </div>
          <div className="flex gap-2">
            <button
               onClick={downloadSummaryReport}
               className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-full transition-all border border-blue-200 hover:border-blue-600"
             >
               <Download size={14} />
               রিপোর্ট ডাউনলোড
             </button>
             <button
               onClick={downloadOfficialReport}
               className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-white hover:bg-green-700 px-3 py-1.5 rounded-full transition-all border border-green-200 hover:border-green-700"
             >
               <FileText size={14} />
               অফিসিয়াল রিপোর্ট
             </button>
            {(filterDivision || filterDistrict || filterSeat || filterParty) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-full transition-all border border-red-200 hover:border-red-600"
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

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Top Winners Card - Single Champion */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg flex flex-col justify-center min-h-[140px]">
           <div className="text-green-100 text-sm font-medium mb-3 border-b border-green-500 pb-1">ফলাফল (বিজয়ী দল)</div>
           
           {topWinner ? (
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold tracking-tight">
                  {topWinner.party}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white text-green-700 font-bold px-3 py-1 rounded text-lg shadow-sm">
                    {topWinner.wins.toLocaleString('bn-BD')} <span className="text-sm font-normal">আসন</span>
                  </span>
                </div>
              </div>
           ) : (
             <div className="text-center opacity-70 italic text-sm py-4">
               {loading ? "লোডিং..." : "এখনও কোনো বিজয়ী নেই"}
             </div>
           )}
           
           {summaryStats.length > 1 && topWinner && (
             <div className="text-xs text-green-200 mt-auto pt-4 flex items-center gap-1">
               <span className="opacity-75">+ আরও {summaryStats.filter(s => s.wins > 0 && s.party !== topWinner.party).length.toLocaleString('bn-BD')} টি দল আসন পেয়েছে</span>
             </div>
           )}
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg min-h-[140px]">
           <div className="text-blue-100 text-sm font-medium mb-1">মোট প্রদত্ত ভোট</div>
           <div className="text-3xl font-bold mt-2">
             {summaryStats.reduce((sum, s) => sum + s.totalVotes, 0).toLocaleString('bn-BD')}
           </div>
           <div className="text-sm opacity-80 mt-2">সকল দলের যোগফল</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg min-h-[140px]">
           <div className="text-purple-100 text-sm font-medium mb-1">অংশগ্রহণকারী দল</div>
           <div className="text-3xl font-bold mt-2">
             {summaryStats.filter(s => s.participations > 0).length.toLocaleString('bn-BD')}
           </div>
           <div className="text-sm opacity-80 mt-2">যাদের প্রাপ্ত ভোট &gt; ০</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'table' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Table size={16} />
            টেবিল ভিউ
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'charts' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={16} />
            গ্রাফ ও চার্ট
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on Tab */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-bottom-2">
          {chartData.length > 0 ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 mb-4 text-center">আসন জয়ের পরিসংখ্যান (শুধুমাত্র বিজয়ী)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={12} tick={{fill: '#4B5563'}} />
                      <YAxis fontSize={12} tick={{fill: '#4B5563'}} allowDecimals={false} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} টি`, 'আসন']}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="wins" name="বিজয়" fill="#16a34a" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
                <h3 className="text-sm font-bold text-gray-600 mb-4 text-center">মোট ভোট বন্টন (শুধুমাত্র বিজয়ী)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="votes"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString('bn-BD')} ভোট`, 'মোট ভোট']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              {loading ? "ডাটা লোড হচ্ছে..." : "এখনও কোনো দল আসন জিতেনি।"}
            </div>
          )}
        </div>
      )}

      {activeTab === 'table' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Vote className="text-green-600" size={20} />
              দলের অবস্থান ও ফলাফল সারসংক্ষেপ
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-white uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3 border-r border-gray-700 text-center w-20">অবস্থান</th>
                  <th className="px-6 py-3 border-r border-gray-700">দলের নাম</th>
                  <th className="px-6 py-3 border-r border-gray-700 text-center">বিজয়ী আসন</th>
                  <th className="px-6 py-3 border-r border-gray-700 text-center">পরাজিত</th>
                  <th className="px-6 py-3 text-right">মোট প্রাপ্ত ভোট</th>
                </tr>
              </thead>
              <tbody>
                {summaryStats.filter(s => s.participations > 0).length > 0 ? (
                  summaryStats
                    .filter(s => s.participations > 0) // Only show parties that have data
                    .map((stat, idx) => {
                    const rank = (idx + 1).toLocaleString('bn-BD');
                    const isTop = idx === 0 && stat.wins > 0;
                    const losses = stat.participations - stat.wins;

                    return (
                      <tr key={stat.party} className={`
                        border-b hover:bg-gray-50 transition-colors
                        ${isTop ? 'bg-yellow-50' : 'bg-white'}
                      `}>
                        <td className="px-6 py-3 text-center border-r border-gray-200 font-bold text-gray-500">
                          #{rank}
                        </td>
                        <td className="px-6 py-3 border-r border-gray-200 font-bold text-gray-800 text-lg">
                          {stat.party}
                        </td>
                        <td className="px-6 py-3 text-center border-r border-gray-200">
                          <button
                            onClick={() => onNavigateToMap && stat.wins > 0 && onNavigateToMap(stat.party)}
                            disabled={stat.wins === 0}
                            className={`
                              inline-flex items-center px-3 py-1 rounded-full text-sm font-bold transition-transform active:scale-95
                              ${stat.wins > 0 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer shadow-sm border border-green-200' 
                                : 'bg-gray-100 text-gray-500 cursor-default'}
                            `}
                            title={stat.wins > 0 ? "ম্যাপে বিজয়ী আসনগুলো দেখুন" : ""}
                          >
                            {stat.wins > 0 && <MapPin size={12} className="mr-1" />}
                            {stat.wins.toLocaleString('bn-BD')} টি
                          </button>
                        </td>
                        <td className="px-6 py-3 text-center border-r border-gray-200">
                          <span className={`
                            inline-flex items-center px-3 py-1 rounded-full text-sm font-bold
                            ${losses > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}
                          `}>
                            {losses.toLocaleString('bn-BD')} টি
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-gray-700 font-medium">
                          {stat.totalVotes.toLocaleString('bn-BD')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      {loading ? "ডাটা লোড হচ্ছে..." : "কোনো ফলাফল পাওয়া যায়নি।"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryView;