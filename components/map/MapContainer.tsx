import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { DISTRICT_TRANSLATIONS } from '../../constants';

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

// Memoized Icon Cache
const iconCache: Record<string, L.DivIcon> = {};

// Function to generate the HTML for the icon based on division color
const getBlinkingIcon = (division: string) => {
  const safeDiv = division ? division.replace(/\s+/g, '-') : 'default';
  
  if (!iconCache[safeDiv]) {
    iconCache[safeDiv] = L.divIcon({
        className: 'blinking-marker-container',
        html: `<div class="blinking-dot-${safeDiv}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -8],
        tooltipAnchor: [0, -8] 
    });
  }
  return iconCache[safeDiv];
};

let suspendedIcon: L.DivIcon | null = null;
const getSuspendedIcon = () => {
  if (!suspendedIcon) {
    suspendedIcon = L.divIcon({
        className: 'blinking-marker-container',
        html: `<div class="blinking-dot-suspended"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -8],
        tooltipAnchor: [0, -8] 
    });
  }
  return suspendedIcon;
};

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

interface MapContainerComponentProps {
  center: [number, number];
  zoom: number;
  isLoading: boolean;
  markers: any[];
  geoJsonData?: any; 
  districtWinners?: Record<string, string>; 
}

const MapContainerComponent: React.FC<MapContainerComponentProps> = ({ 
  center, zoom, isLoading, markers, geoJsonData, districtWinners 
}) => {
  const geoJsonRef = useRef<L.GeoJSON>(null);

  // Update GeoJSON layer when data changes
  useEffect(() => {
    if (geoJsonRef.current) {
        geoJsonRef.current.clearLayers();
        if (geoJsonData) {
            geoJsonRef.current.addData(geoJsonData);
        }
    }
  }, [geoJsonData]);

  // Style Function for GeoJSON
  const geoJsonStyle = (feature: any) => {
    let fillColor = '#ffffff'; // Default white
    let weight = 1;
    let color = '#666';
    let fillOpacity = 0.1;

    // Handle both property names (adm2_en for bidduth79, name for highcharts)
    const distNameEn = feature.properties.adm2_en || feature.properties.name;
    const distNameBn = DISTRICT_TRANSLATIONS[distNameEn] || distNameEn; // Fallback
    
    if (districtWinners && distNameBn && districtWinners[distNameBn]) {
        fillColor = districtWinners[distNameBn];
        fillOpacity = 0.4;
    }
    
    // Highlight if selected
    if (geoJsonData?.level === 'district_highlight') {
        weight = 3;
        color = '#1f2937'; // Dark gray
        fillOpacity = 0.2;
    }

    return {
        fillColor: fillColor,
        weight: weight,
        opacity: 1,
        color: color,
        dashArray: '',
        fillOpacity: fillOpacity
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const name = feature.properties.adm2_en || feature.properties.name;
    if (name) {
       layer.bindTooltip(`${name}`, {
           permanent: false,
           direction: "center",
           className: "bg-white/80 px-2 py-0.5 rounded border border-gray-300 text-[10px] font-bold shadow-sm backdrop-blur-sm"
       });
    }
  };

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 h-[600px] w-full relative z-0">
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
      
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-300 relative bg-slate-50">
        
        <MapContainer 
          center={center} 
          zoom={zoom} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={center} zoom={zoom} />
          
          {/* GeoJSON Layer (Borders) */}
          {geoJsonData && (
             <GeoJSON 
                ref={geoJsonRef}
                data={geoJsonData} 
                style={geoJsonStyle}
                onEachFeature={onEachFeature}
             />
          )}

          {/* Markers Layer (Seats) */}
          {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-[500]">
                <Loader2 className="animate-spin text-green-600" size={40} />
              </div>
          ) : (
            markers.map((seat) => (
              <Marker 
                key={seat.seatNo} 
                position={seat.position} 
                icon={seat.isSuspended ? getSuspendedIcon() : getBlinkingIcon(seat.division)}
                zIndexOffset={1000} // Force on top
              >
                <Tooltip 
                    direction="top" 
                    offset={[0, -10]} 
                    opacity={1} 
                    sticky={true} 
                >
                  <div className="p-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[240px]">
                    <div className={`p-2 border-b border-gray-200 ${seat.isSuspended ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <h3 className="font-bold text-sm text-gray-800 flex items-center justify-center gap-1">
                        <MapPin size={12} className={seat.isSuspended ? "text-gray-800" : "text-red-500"} />
                        {seat.seatNo}
                        <span className="text-xs font-normal text-gray-500">({seat.district})</span>
                      </h3>
                    </div>
                    
                    <div className="p-2">
                        {seat.isSuspended ? (
                            <div className="py-2 text-center text-red-600 font-bold flex flex-col items-center gap-1 animate-pulse">
                                <AlertTriangle size={24} />
                                নির্বাচন স্থগিত
                            </div>
                        ) : (
                            <>
                                {seat.results && seat.results.length > 0 ? (
                                    <>
                                        {(() => {
                                        const winner = seat.results.reduce((p: any, c: any) => p.votes > c.votes ? p : c);
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
                                                .sort((a: any, b: any) => b.votes - a.votes)
                                                .slice(0, 3)
                                                .map((r: any, idx: number) => (
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
                            </>
                        )}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))
          )}
        </MapContainer>
        
      </div>
    </div>
  );
};

export default MapContainerComponent;