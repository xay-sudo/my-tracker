'use client';

import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap({ visits }: { visits: any[] }) {

  // 1. Count visitors per country (e.g. { "US": 5, "KH": 10 })
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      if (v.country) {
        // Normalize: Database might save "KH", map might need "KHM".
        // For simplicity, we assume your DB saves 2-letter codes.
        const code = v.country.toUpperCase();
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [visits]);

  // 2. Color Scale (Light Green to Dark Green based on traffic)
  const maxVisitors = Math.max(...Object.values(countryCounts), 0);
  const colorScale = scaleLinear<string>()
    .domain([0, maxVisitors || 1])
    .range(["#1f2937", "#22c55e"]); // Gray-900 to Green-500

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-xl relative">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Live Map</h3>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 100 }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Try to match ISO 2 code (Map uses ISO 3 usually, we might need a mapping later)
              // For now, we just draw the base map.
              const isActive = false;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActive ? "#22c55e" : "#374151"}
                  stroke="#111827"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#4ade80", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Overlay for "No Data" if empty */}
      {visits.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-600 text-sm">Waiting for data...</p>
         </div>
      )}
    </div>
  );
}