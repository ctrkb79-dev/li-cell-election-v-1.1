import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import SearchableSelect from '../SearchableSelect';
import { LOCATION_DATA, SEAT_DATA, DISTRICT_COORDINATES, PARTIES, DISTRICT_TRANSLATIONS, PARTY_COLORS } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Filter, MapPin, Trophy, Vote, Users, RotateCcw, AlertTriangle } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import MapContainerComponent from '../components/map/MapContainer';
import MapOverlay from '../components/map/MapOverlay';

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
  updatedAt?: any;
  isSuspended?: boolean;
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

  // GeoJSON Data States
  const [geoJsonDistricts, setGeoJsonDistricts] = useState<any>(null);
  const [geoLoadingError, setGeoLoadingError] = useState<string | null>(null);
  
  // Sync initial party prop
  useEffect(() => {
    if (initialParty) setFilterParty(initialParty);
  }, [initialParty]);

  // Fetch all election data
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "seats"));
        const data: SeatData[] = [];
        querySnapshot.forEach((doc) => {
          const d = doc.data();
          const sanitizedResults = Array.isArray(d.results) 
            ? d.results.map((r: any) => ({
                party: r.party || '',
                votes: Number(r.votes) || 0
            }))
            : [];

          data.push({
            seatNo: d.seatNo,
            division: d.division,
            district: d.district,
            results: sanitizedResults,
            totalVotes: Number(d.totalVotes) || 0,
            updatedAt: d.updatedAt ? { seconds: d.updatedAt.seconds } : null,
            // @ts-ignore
            isSuspended: !!d.isSuspended
          });
        });
        setAllSeatsData(data);
      } catch (error: any) {
        console.error("Error fetching map data:", error?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Fetch GeoJSON Data
  useEffect(() => {
    const fetchGeoJSON = async () => {
        setGeoLoadingError(null);
        try {
            // 1. Try fetching from local public folder first
            let response = await fetch('/bd-districts.json');
            
            if (response.ok) {
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    // Check if it is Highcharts format (which has 'hc-transform')
                    // Highcharts JSON isn't directly compatible with Leaflet's standard GeoJSON loader
                    if (json['hc-transform'] || !json.features) {
                        console.warn("Local file is Highcharts format (incompatible). Falling back...");
                        throw new Error("Incompatible Format");
                    }
                    setGeoJsonDistricts(json);
                    return;
                } catch (e) {
                    console.warn("Local JSON parse/validation failed, using remote.");
                }
            }

            // 2. Fallback to CORRECT Raw GitHub URL (Standard WGS84 GeoJSON)
            response = await fetch('https://raw.githubusercontent.com/bidduth79/bangladesh-geojson/master/bangladesh_geojson_adm2_64_districts_zillas.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setGeoJsonDistricts(data);
        } catch (error: any) {
            console.error("GeoJSON Load Error:", error);
            setGeoLoadingError("মানচিত্রের বর্ডার লোড করা যায়নি (ইন্টারনেট সংযোগ চেক করুন)");
        }
    };
    fetchGeoJSON();
  }, []);

  // Calculate District Winners for Coloring
  const districtWinners = useMemo(() => {
    const wins: Record<string, string> = {}; // DistrictName -> PartyColor
    
    // Group seats by district
    const distMap: Record<string, { [party: string]: number }> = {};
    
    allSeatsData.forEach(seat => {
        if (!distMap[seat.district]) distMap[seat.district] = {};
        
        // Find winner of this seat
        if (seat.results && seat.results.length > 0) {
            const seatWinner = seat.results.reduce((p, c) => p.votes > c.votes ? p : c);
            if (seatWinner.votes > 0) {
                // Increment district tally for this party
                distMap[seat.district][seatWinner.party] = (distMap[seat.district][seatWinner.party] || 0) + 1;
            }
        }
    });

    // Determine district winner
    Object.keys(distMap).forEach(dist => {
        let maxWins = 0;
        let bestParty = '';
        Object.entries(distMap[dist]).forEach(([party, count]) => {
            if (count > maxWins) {
                maxWins = count;
                bestParty = party;
            }
        });
        if (bestParty) {
            wins[dist] = PARTY_COLORS[bestParty] || '#9ca3af';
        }
    });

    return wins;
  }, [allSeatsData]);

  // Derived Options
  const districts = useMemo(() => {
    if (!filterDivision) return [];
    return Object.keys(LOCATION_DATA[filterDivision] || {});
  }, [filterDivision]);

  const seats = useMemo(() => {
    if (!filterDistrict) return [];
    return SEAT_DATA[filterDistrict] || [];
  }, [filterDistrict]);

  const availableParties = useMemo(() => {
    const set = new Set(PARTIES);
    allSeatsData.forEach(seat => {
        seat.results.forEach(r => set.add(r.party));
    });
    return Array.from(set).sort();
  }, [allSeatsData]);

  const handleResetFilters = () => {
    setFilterDivision('');
    setFilterDistrict('');
    setFilterSeat('');
    setFilterParty('');
  };

  // Handle Location & Zoom Changes - IMPROVED CENTERING LOGIC
  useEffect(() => {
    if (filterSeat) {
      // Seat Level
      const coords = DISTRICT_COORDINATES[filterDistrict];
      if (coords) {
        const lat = coords[0] + getCoordinateOffset(filterSeat + 'lat');
        const lng = coords[1] + getCoordinateOffset(filterSeat + 'lng');
        setMapCenter([lat, lng]);
        setZoomLevel(10);
      }
    } else if (filterDistrict) {
      // District Level
      const coords = DISTRICT_COORDINATES[filterDistrict];
      if (coords) {
        setMapCenter(coords);
        setZoomLevel(9);
      }
    } else if (filterDivision) {
      // Division Level - Calculate Centroid of all districts in division
      const districtsInDiv = Object.keys(LOCATION_DATA[filterDivision] || {});
      let latSum = 0, lngSum = 0, count = 0;
      
      districtsInDiv.forEach(d => {
          const c = DISTRICT_COORDINATES[d];
          if (c) {
              latSum += c[0];
              lngSum += c[1];
              count++;
          }
      });

      if (count > 0) {
          setMapCenter([latSum / count, lngSum / count]);
          setZoomLevel(8); // Better zoom for division view
      }
    } else {
      // National Level
      setMapCenter([23.6850, 90.3563]);
      setZoomLevel(7);
    }
  }, [filterDivision, filterDistrict, filterSeat]);

  // Logic for displaying markers (dots)
  const displayableMarkers = useMemo(() => {
    const isAnyLocationFilterActive = filterDivision || filterDistrict || filterSeat;

    return allSeatsData
      .filter(seat => {
        if (filterDivision && seat.division !== filterDivision) return false;
        if (filterDistrict && seat.district !== filterDistrict) return false;
        if (filterSeat && seat.seatNo !== filterSeat) return false;

        // If filtering by party, ensure this party is winning OR present
        if (filterParty) {
            if (!seat.isSuspended) {
                if (!seat.results || seat.results.length === 0) return false;
                const sortedResults = [...seat.results].sort((a,b) => b.votes - a.votes);
                const winner = sortedResults[0];
                if (!winner || winner.votes === 0 || winner.party !== filterParty) {
                    return false;
                }
            }
        }

        if (!isAnyLocationFilterActive && !filterParty) {
          return seat.totalVotes > 0 || seat.isSuspended;
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

  // Logic for GeoJSON Filtering
  const filteredGeoJSON = useMemo(() => {
      if (!geoJsonDistricts) return null;

      // Handle both "adm2_en" (Bidduth79) and "name" (Highcharts/Others)
      const getName = (f: any) => f.properties.adm2_en || f.properties.name || "";

      // Case 1: District Filter Selected
      if (filterDistrict) {
          // Try to match Bengali district to English name in GeoJSON
          const englishDistName = Object.keys(DISTRICT_TRANSLATIONS).find(key => DISTRICT_TRANSLATIONS[key] === filterDistrict);
          
          if (englishDistName) {
              const features = geoJsonDistricts.features.filter((f: any) => 
                  getName(f).toLowerCase() === englishDistName.toLowerCase()
              );
              if (features.length > 0) {
                  return { type: "FeatureCollection", features, level: 'district_highlight' };
              }
          }
      }

      // Case 2: Division Filter Selected
      if (filterDivision) {
          const targetDistricts = Object.keys(LOCATION_DATA[filterDivision] || {}); // Bengali names
          
          const features = geoJsonDistricts.features.filter((f: any) => {
              const nameEn = getName(f);
              const bnName = DISTRICT_TRANSLATIONS[nameEn] || nameEn; // Fallback to EN if translation missing
              // Check if the bengali name exists in our target district list for this division
              // Simple check: translation map handles the EN->BN conversion
              return targetDistricts.includes(bnName);
          });
          
          if (features.length > 0) {
              return { type: "FeatureCollection", features, level: 'division_highlight' };
          }
      }

      // Case 3: Default (Show All)
      return { ...geoJsonDistricts, level: 'national' };

  }, [geoJsonDistricts, filterDistrict, filterDivision]);


  // Dynamic Calculation for Glass Summary Card
  const viewStats = useMemo(() => {
    if (displayableMarkers.length === 0) return null;

    let totalVotes = 0;
    const partyWins: {[key: string]: number} = {};
    let suspended = 0;

    displayableMarkers.forEach(seat => {
      if (seat.isSuspended) {
          suspended++;
          return;
      }
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
      leadingWins: maxWins,
      suspended
    };
  }, [displayableMarkers]);

  const hasActiveFilter = filterDivision || filterDistrict || filterSeat || filterParty;

  return (
    <div className="space-y-4 animate-in fade-in h-full flex flex-col relative">
      <style>{`
        .blinking-dot-suspended {
            width: 14px;
            height: 14px;
            background-color: #000;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px #ef4444;
            animation: pulse-suspended 1s infinite;
        }
        @keyframes pulse-suspended {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      <FilterBar 
        division={filterDivision} setDivision={setFilterDivision}
        district={filterDistrict} setDistrict={setFilterDistrict}
        seat={filterSeat} setSeat={setFilterSeat}
        party={filterParty} setParty={setFilterParty}
        onReset={handleResetFilters}
        title="ম্যাপ ফিল্টার"
        className="shrink-0 shadow-sm"
        partyOptions={availableParties}
      />

      <div className="relative">
        <MapContainerComponent 
          center={mapCenter}
          zoom={zoomLevel}
          isLoading={isLoading} 
          markers={displayableMarkers}
          geoJsonData={filteredGeoJSON}
          districtWinners={districtWinners}
        />
        
        {/* Error Notification for GeoJSON */}
        {geoLoadingError && (
            <div className="absolute top-2 left-2 z-[400] bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded shadow-md text-xs max-w-xs">
                <strong>ত্রুটি:</strong> {geoLoadingError}
            </div>
        )}
        
        {hasActiveFilter && viewStats && (
          <MapOverlay stats={viewStats} />
        )}
      </div>
    </div>
  );
};

export default MapView;