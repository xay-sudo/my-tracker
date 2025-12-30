'use client';

import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap({ visits }: { visits: any[] }) {
  const activeCountries = useMemo(() => {
    return new Set(visits.map(v => v.country?.toUpperCase()));
  }, [visits]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl border border-gray-800 relative">
      <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryCode = geo.properties.ISO_A2; // Map standard
              const isActive = activeCountries.has(countryCode);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActive ? "#22c55e" : "#374151"}
                  stroke="#111827"
                  strokeWidth={0.5}
                  style={{ default: { outline: "none" }, hover: { fill: "#4ade80" } }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}