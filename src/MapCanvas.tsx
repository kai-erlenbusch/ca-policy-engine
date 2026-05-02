import { useSql } from '@sqlrooms/duckdb';
import { useMosaicClient, Query, sql } from '@sqlrooms/mosaic';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMemo, useEffect, useState } from 'react';
import { useRoomStore } from './store';

const INITIAL_VIEW_STATE = { longitude: -119.5, latitude: 37.5, zoom: 5, pitch: 0, bearing: 0 };

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

export default function MapCanvas() {
  const countiesReady = useRoomStore((state) => state.db.findTableByName('counties'));
  const bondsReady = useRoomStore((state) => state.db.findTableByName('bonds'));
  const getConnector = useRoomStore((state) => state.db.getConnector);

  const [spatialReady, setSpatialReady] = useState(false);

  useEffect(() => {
    getConnector().then(async (connector: any) => {
      await connector.query('INSTALL spatial; LOAD spatial;');
      setSpatialReady(true);
    }).catch(console.error);
  }, [getConnector]);

  // 1. STATIC GEOMETRY: Load map shapes safely
  const { data: countiesData } = useSql({
    query: `
      SELECT 
        NAME10 as "CountyName",
        ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(geometry, 'EPSG:3857', 'EPSG:4326'))) as "geojson"
      FROM counties
    `,
    // ONLY execute when both tables and spatial extension are fully loaded
    enabled: Boolean(countiesReady && spatialReady) 
  });

  // 2. REACTIVE FINANCE: Mounts immediately to prevent the "null" connection error!
  const { data: fundingData } = useMosaicClient({
    selectionName: 'brush', 
    query: (filter: any) => {
      // Send a safe dummy query until the CSV is fully downloaded
      if (!bondsReady) {
        return Query.select({ loading_placeholder: sql`1` as any }).limit(0);
      }
      
      // Once ready, ask for the raw string and money
      return Query.from('bonds')
        .select({
          IssuerCounty: 'IssuerCounty',
          total_funding: sql`SUM(PrincipalAmount)` as any
        })
        .where(filter)
        .groupby('IssuerCounty');
    }
  });

  // 3. Prepare the Map Shapes
  const geojsonFeatures = useMemo(() => {
    if (!countiesData) return null;
    try {
      const features: any[] = [];
      const rows = (countiesData as any).toArray(); 
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any;
        const cName = row.CountyName || row.countyname;
        const gJson = row.geojson || row.Geojson;

        if (gJson && cName) {
          features.push({
            type: 'Feature',
            geometry: JSON.parse(gJson),
            properties: { 
              name: cName,
              matchKey: String(cName).trim().toUpperCase() 
            }
          });
        }
      }
      return features;
    } catch (e) {
      console.error("Error parsing GeoJSON", e);
      return null;
    }
  }, [countiesData]);

  // 4. THE JAVASCRIPT BRIDGE: Splits "Marin; Monterey" fairly!
  const fundingMap = useMemo(() => {
    const map = new window.Map<string, number>();
    if (!fundingData) return map;
    
    const rows = (fundingData as any).toArray();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const iCounty = row.IssuerCounty || row.issuercounty;
      const tFunding = row.total_funding || row.Total_funding;

      if (iCounty) {
        // Split the list and divide the money evenly
        const countyList = String(iCounty).split(';');
        const splitFunding = (Number(tFunding) || 0) / countyList.length;

        for (const county of countyList) {
          const cleanName = county.trim().toUpperCase();
          const existingFunding = map.get(cleanName) || 0;
          map.set(cleanName, existingFunding + splitFunding);
        }
      }
    }
    return map;
  }, [fundingData]);

  // 5. Paint the Map
  const layer = useMemo(() => {
    if (!geojsonFeatures) return null;
    
    return new GeoJsonLayer({
      id: 'counties-funding-layer',
      data: geojsonFeatures as any,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 100],
      getFillColor: (d: any) => {
        const matchKey = d.properties.matchKey;
        const funding = fundingMap.get(matchKey) || 0;
        
        if (funding === 0) return [30, 40, 50, 150]; 
        if (funding < 50_000_000) return [198, 219, 239, 200]; 
        if (funding < 250_000_000) return [158, 202, 225, 200];
        if (funding < 1_000_000_000) return [107, 174, 214, 200];
        if (funding < 5_000_000_000) return [49, 130, 189, 200];
        return [8, 81, 156, 200]; 
      },
      updateTriggers: {
        // CRITICAL: Force Deck.gl to repaint the instant Mosaic hands us new data
        getFillColor: [fundingData] 
      }
    });
  }, [geojsonFeatures, fundingMap, fundingData]);

  // Render a loading screen while DuckDB downloads files
  if (!countiesReady || !bondsReady || !spatialReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
        <h1 className="text-xl tracking-widest animate-pulse">Loading spatial engine...</h1>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-900">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layer ? [layer] : []}
        getTooltip={({ object }: any) => {
          if (!object) return null;
          const matchKey = object.properties.matchKey;
          const funding = fundingMap.get(matchKey) || 0;
          return `${object.properties.name} County\nFunding: ${formatMoney(funding)}`;
        }}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
      </DeckGL>
    </div>
  );
}