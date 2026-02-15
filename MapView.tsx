import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import SearchableSelect from './SearchableSelect';
import { LOCATION_DATA, SEAT_DATA, DISTRICT_COORDINATES, PARTIES } from './constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Loader2, Filter, MapPin, Trophy, Vote, Users, RotateCcw } from 'lucide-react';

// Division Color Mapping
const DIVISION_COLORS: { [key: string]: string } = {
  "ঢাকা": "#ef4444",      // Red
  "চট্টগ্রাম": "#3b82f6", // Blue
  "রাজশাহী": "#22c55e",   // Green
  "খুলনা": "#f97316",     // Orange
  "বরিশাল": "#a855f7",    // Purple
  "সিলেট": "#06b6d4",     // Cyan
  "রংপুর": "#ec4899",     // Pink
  "ময়মনসিংহ": "#6366f1"   // Indigo
};

// Function to generate the HTML for the icon based on division color
const createBlinkingIcon = (division: string) => {
  const safeDiv = division ? division.replace(/\s+/g, '-') : 'default';
  
  return L.divIcon({
    className: 'blinking-marker-container',
    html: `<div class="blinking-dot-${safeDiv}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
    tooltipAnchor: [0, -8] 
  });
};

// Component to handle map movement
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

// Helper to generate a consistent small offset based on string hash
const getCoordinateOffset = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const offset = (hash % 1000) / 15000; 
  return offset;
};

interface PartyResult {
  party: string;
  votes: number;
}

interface SeatData {
  seatNo: string;
  division: string;
  district: string;
  results: PartyResult[];
  totalVotes: number;
}

interface MapViewProps {
  initialParty?: string;
}

const MapView: React.FC<MapViewProps> = ({ initialParty }) => {
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterSeat, setFilterSeat] = useState('');
  const [filterParty, setFilterParty] = useState(initialParty || '');
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.6850, 90.3563]);
  const [zoomLevel, setZoomLevel] = useState(7);
  
  const [allSeatsData, setAllSeatsData] = useState<SeatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync initial party prop
  useEffect(() => {
    if (initialParty) setFilterParty(initialParty);
  }, [initialParty]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const data: SeatData[] = [];
        querySnapshot.forEach((doc) => {
          data.push(doc.data() as SeatData);
        });
        setAllSeatsData(data);
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Derived Options
  const districts = useMemo(() => {
    if (!filterDivision) return [];
    return Object.keys(LOCATION_DATA[filterDivision] || {});
  }, [filterDivision]);

  const seats = useMemo(() => {
    if (!filterDistrict) return [];
    return SEAT_DATA[filterDistrict] || [];
  }, [filterDistrict]);

  // Handle Location & Zoom Changes
  useEffect(() => {
    if (filterSeat) {
      const coords = DISTRICT_COORDINATES[filterDistrict];
      if (coords) {
        const lat = coords[0] + getCoordinateOffset(filterSeat + 'lat');
        const lng = coords[1] + getCoordinateOffset(filterSeat + 'lng');
        setMapCenter([lat, lng]);
        setZoomLevel(12);
      }
    } else if (filterDistrict) {
      const coords = DISTRICT_COORDINATES[filterDistrict];
      if (coords) {
        setMapCenter(coords);
        setZoomLevel(10);
      }
    } else if (filterDivision) {
      const firstDistrict = Object.keys(LOCATION_DATA[filterDivision] || {})[0];
      const coords = DISTRICT_COORDINATES[firstDistrict];
      if (coords) {
        setMapCenter(coords);
        setZoomLevel(9);
      }
    } else {
      setMapCenter([23.6850, 90.3563]);
      setZoomLevel(7);
    }
  }, [filterDivision, filterDistrict, filterSeat]);

  // Logic for displaying markers
  const displayableMarkers = useMemo(() => {
    const isAnyLocationFilterActive = filterDivision || filterDistrict || filterSeat;

    return allSeatsData
      .filter(seat => {
        if (filterDivision && seat.division !== filterDivision) return false;
        if (filterDistrict && seat.district !== filterDistrict) return false;
        if (filterSeat && seat.seatNo !== filterSeat) return false;

        if (filterParty) {
            if (!seat.results || seat.results.length === 0) return false;
            const sortedResults = [...seat.results].sort((a,b) => b.votes - a.votes);
            const winner = sortedResults[0];
            if (!winner || winner.votes === 0 || winner.party !== filterParty) {
                return false;
            }
        }

        if (!isAnyLocationFilterActive && !filterParty) {
          return seat.totalVotes > 0;
        }
        return true;
      })
      .map(seat => {
        const baseCoords = DISTRICT_COORDINATES[seat.district];
        if (!baseCoords) return null;
        const lat = baseCoords[0] + getCoordinateOffset(seat.seatNo + 'lat');
        const lng = baseCoords[1] + getCoordinateOffset(seat.seatNo + 'lng');
        return {
          ...seat,
          position: [lat, lng] as [number, number]
        };
      })
      .filter((item): item is (SeatData & { position: [number, number] }) => item !== null);
  }, [allSeatsData, filterDivision, filterDistrict, filterSeat, filterParty]);

  // Dynamic Calculation for Glass Summary Card
  const viewStats = useMemo(() => {
    if (displayableMarkers.length === 0) return null;

    let totalVotes = 0;
    const partyWins: {[key: string]: number} = {};

    displayableMarkers.forEach(seat => {
      totalVotes += seat.totalVotes;
      if (seat.results && seat.results.length > 0) {
        const winner = seat.results.reduce((p, c) => (p.votes > c.votes ? p : c));
        if (winner.votes > 0) {
           partyWins[winner.party] = (partyWins[winner.party] || 0) + 1;
        }
      }
    });

    let leadingParty = '';
    let maxWins = 0;
    Object.entries(partyWins).forEach(([party, wins]) => {
      if (wins > maxWins) {
        maxWins = wins;
        leadingParty = party;
      }
    });

    return {
      seatCount: displayableMarkers.length,
      totalVotes,
      leadingParty,
      leadingWins: maxWins
    };
  }, [displayableMarkers]);

  const hasActiveFilter = filterDivision || filterDistrict || filterSeat || filterParty;

  const resetFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
  };

  return (
    <div className="space-y-4 animate-in fade-in h-full flex flex-col">
      <style>
        {Object.entries(DIVISION_COLORS).map(([div, color]) => {
          const safeDiv = div.replace(/\s+/g, '-');
          return `
            .blinking-dot-${safeDiv} {
              width: 12px;
              height: 12px;
              background-color: ${color};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 10px ${color};
              animation: pulse-${safeDiv} 1.5s infinite;
            }
            .blinking-dot-default {
              width: 12px;
              height: 12px;
              background-color: #6b7280;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 10px #6b7280;
              animation: pulse-default 1.5s infinite;
            }
            @keyframes pulse-${safeDiv} {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 ${color}B3; }
              70% { transform: scale(1); box-shadow: 0 0 0 6px ${color}00; }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 ${color}00; }
            }
            @keyframes pulse-default {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 #6b7280B3; }
              70% { transform: scale(1); box-shadow: 0 0 0 6px #6b728000; }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 #6b728000; }
            }
            .leaflet-tooltip {
              background-color: transparent;
              border: none;
              box-shadow: none;
              padding: 0;
            }
          `;
        }).join('')}
      </style>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0">
         <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
               <Filter size={18} />
               মানচিত্র ও ফলাফল ফিল্টার
            </div>
            
            {hasActiveFilter ? (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-full transition-all border border-red-200 hover:border-red-600 animate-in fade-in"
              >
                <RotateCcw size={12} />
                রিসেট
              </button>
            ) : (
              <span className="text-xs font-normal text-gray-500 hidden sm:inline">
                (স্থান নির্বাচন করুন)
              </span>
            )}
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
              placeholder="বিভাগ"
            />
            <SearchableSelect
              options={districts}
              value={filterDistrict}
              onChange={(val) => {
                setFilterDistrict(val);
                setFilterSeat('');
              }}
              disabled={!filterDivision}
              placeholder="জেলা"
            />
            <SearchableSelect
              options={seats}
              value={filterSeat}
              onChange={(val) => setFilterSeat(val)}
              disabled={!filterDistrict}
              placeholder="আসন"
            />
            <SearchableSelect
              options={PARTIES}
              value={filterParty}
              onChange={(val) => setFilterParty(val)}
              placeholder="দল অনুযায়ী খুঁজুন"
            />
         </div>
         
         <div className="mt-3 flex flex-wrap gap-2 justify-center border-t pt-2">
            {Object.entries(DIVISION_COLORS).map(([div, color]) => (
              <button
                key={div}
                onClick={() => {
                  setFilterDivision(div);
                  setFilterDistrict('');
                  setFilterSeat('');
                }}
                className={`
                   flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all
                   ${filterDivision === div 
                     ? 'bg-gray-100 ring-2 ring-offset-1 ring-gray-300 font-bold shadow-sm' 
                     : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}
                `}
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                <span className="text-gray-700">{div}</span>
              </button>
            ))}
         </div>
      </div>

      {/* Map Container with Overlay Elements */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 h-[600px] w-full relative z-0">
        <div className="h-full w-full rounded-lg overflow-hidden border border-gray-300 relative bg-slate-50">
          
          <MapContainer 
            center={mapCenter} 
            zoom={zoomLevel} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
            className="z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater center={mapCenter} zoom={zoomLevel} />
            
            {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-[500]">
                 <Loader2 className="animate-spin text-green-600" size={40} />
               </div>
            ) : (
              displayableMarkers.map((seat) => (
                <Marker 
                  key={seat.seatNo} 
                  position={seat.position} 
                  icon={createBlinkingIcon(seat.division)}
                >
                  <Tooltip 
                     direction="top" 
                     offset={[0, -10]} 
                     opacity={1} 
                     sticky={true} 
                  >
                    <div className="p-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[240px]">
                      <div className="bg-gray-50 p-2 border-b border-gray-200">
                        <h3 className="font-bold text-sm text-gray-800 flex items-center justify-center gap-1">
                          <MapPin size={12} className="text-red-500" />
                          {seat.seatNo}
                          <span className="text-xs font-normal text-gray-500">({seat.district})</span>
                        </h3>
                      </div>
                      
                      <div className="p-2">
                        {seat.results && seat.results.length > 0 ? (
                          <>
                             {(() => {
                                const winner = seat.results.reduce((p, c) => p.votes > c.votes ? p : c);
                                if (winner.votes === 0) return <div className="text-[10px] italic text-gray-400 mb-2 text-center">ভোট গণনা শুরু হয়নি</div>;
                                return (
                                  <div className="bg-green-50 p-2 rounded border border-green-100 mb-2 text-center">
                                    <div className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">বর্তমান অবস্থা / বিজয়ী</div>
                                    <div className="font-bold text-green-800 text-base leading-none mb-1">{winner.party}</div>
                                    <div className="text-[11px] text-gray-600 font-mono bg-white inline-block px-1.5 rounded border border-green-100">
                                      {winner.votes.toLocaleString('bn-BD')} ভোট
                                    </div>
                                  </div>
                                );
                              })()}

                              <div>
                                 <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">অন্যান্য প্রার্থী</div>
                                 <ul className="space-y-1">
                                   {seat.results
                                     .sort((a,b) => b.votes - a.votes)
                                     .slice(0, 3)
                                     .map((r, idx) => (
                                     <li key={idx} className="flex justify-between text-[11px] items-center border-b border-gray-50 last:border-0 pb-0.5">
                                       <div className="flex items-center gap-1">
                                         <span className="w-3.5 h-3.5 bg-gray-100 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-500">{idx+1}</span>
                                         <span className="text-gray-700 font-medium">{r.party}</span>
                                       </div>
                                       <span className="font-mono text-gray-600">{r.votes.toLocaleString('bn-BD')}</span>
                                     </li>
                                   ))}
                                 </ul>
                              </div>
                          </>
                        ) : (
                          <div className="py-2 text-center">
                             <div className="text-xs text-gray-400 italic">কোনো ফলাফল পাওয়া যায়নি</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              ))
            )}
          </MapContainer>
          
          {/* Badge: Top-Right */}
          <div className="absolute top-2 right-2 z-[400] pointer-events-none">
            <span className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Users size={12} className="text-blue-600" />
              {hasActiveFilter 
                ? `${filterParty || filterSeat || filterDistrict || filterDivision}` 
                : 'লাইভ রেজাল্ট ম্যাপ'}
            </span>
          </div>

          {/* Compact Glass Summary: Directly Below Badge (Top-Right) */}
          {hasActiveFilter && viewStats && (
             <div className="absolute top-10 right-2 z-[400] w-56 animate-in slide-in-from-right-2 fade-in mt-1">
                <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-3 text-white shadow-xl border border-white/20 flex flex-col gap-2">
                   
                   <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase">
                        <MapPin size={10} />
                        দৃশ্যমান আসন
                      </div>
                      <div className="font-mono font-bold text-sm">{viewStats.seatCount}</div>
                   </div>

                   <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold uppercase">
                        <Vote size={10} />
                        মোট ভোট
                      </div>
                      <div className="font-mono font-bold text-sm">{viewStats.totalVotes.toLocaleString('bn-BD')}</div>
                   </div>

                   <div>
                      <div className="flex items-center gap-1.5 text-green-200 text-[10px] font-bold uppercase mb-1">
                        <Trophy size={10} />
                        লিডিং দল
                      </div>
                      <div className="flex justify-between items-end">
                         <div className="font-bold text-sm truncate max-w-[120px]">{viewStats.leadingParty || '-'}</div>
                         <div className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                           {viewStats.leadingWins} জয়
                         </div>
                      </div>
                   </div>

                </div>
             </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default MapView;