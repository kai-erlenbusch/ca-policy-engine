import { useMosaicClient, Query, sql } from '@sqlrooms/mosaic';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMemo, useEffect, useState } from 'react';
import { useRoomStore } from './store';

const INITIAL_VIEW_STATE = {
  longitude: -119.5,
  latitude: 37.5,
  zoom: 5,
  pitch: 0,
  bearing: 0
};

// Helper to format currency in the tooltip
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', currency: 'USD', maximumFractionDigits: 0 
  }).format(amount);
};

export default function MapCanvas() {
  const countiesReady = useRoomStore((state) => state.db.findTableByName('counties'));
  const bondsReady = useRoomStore((state) => state.db.findTableByName('bonds'));
  const getConnector = useRoomStore((state) => state.db.getConnector);
  
  const [spatialReady, setSpatialReady] = useState(false);

  // 1. Explicitly load the Spatial Extension
  useEffect(() => {
    getConnector().then(async (connector: any) => {
      await connector.query('INSTALL spatial; LOAD spatial;');
      setSpatialReady(true);
    }).catch(console.error);
  }, [getConnector]);

  // 2. The Mosaic Client: Subscribes to the Control Center's dropdown!
  const { data, isLoading } = useMosaicClient({
    selectionName: 'brush', 
    query: (filter: any) => {
      // Dummy query while data lakes and GIS engines boot up
      if (!countiesReady || !bondsReady || !spatialReady) {
        // A perfectly valid standalone SELECT with a proper selection list!
        return Query.select({ loading_placeholder: sql`1` as any });
      }
      // A. Explode the messy strings and apply the Mosaic filter
      const filteredBonds = Query.from('bonds')
        .select({
          CountyName: sql`UNNEST(string_split(IssuerCounty, '; '))` as any,
          PrincipalAmount: 'PrincipalAmount'
        })
        .where(filter);

      // B. Sum the funding by county
      const funding = Query.from(filteredBonds)
        .select({
          CountyName: 'CountyName',
          total_funding: sql`SUM(PrincipalAmount)` as any
        })
        .groupby('CountyName');

      // C. Spatial Join!
      return Query
        .with({ funding_cte: funding })
        .from(sql`counties c LEFT JOIN funding_cte b ON c.NAME10 = b.CountyName` as any)
        .select({
          CountyName: sql`c.NAME10` as any,
          total_funding: sql`COALESCE(b.total_funding, 0)` as any,
          geojson: sql`ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(c.geometry, 'EPSG:3857', 'EPSG:4326')))` as any
        });
    }
  });

  // 3. Safely parse the GeoJSON and inject the funding data
  const geojsonData = useMemo(() => {
    if (!data) return null;
    
    try {
      const features: any[] = [];
      // Bypass the missing TypeScript definition for Apache Arrow tables
      const rows = (data as any).toArray(); 
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any;
        if (row.geojson) {
          features.push({
            type: 'Feature',
            geometry: JSON.parse(row.geojson),
            properties: { 
              name: row.CountyName,
              total_funding: row.total_funding
            }
          });
        }
      }
      return { type: 'FeatureCollection', features };
    } catch (e) {
      console.error("Error parsing GeoJSON", e);
      return null;
    }
  }, [data]);

  // 4. Create the Deck.gl Choropleth Layer
  const layer = new GeoJsonLayer({
    id: 'counties-funding-layer',
    data: geojsonData as any,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1,
    getLineColor: [255, 255, 255, 100],
    getFillColor: ({ properties }: any) => {
      const funding = properties.total_funding;
      // Dynamic Choropleth Coloring based on Funding Amount
      if (!funding || funding === 0) return [30, 40, 50, 150]; // Dark Gray/Blue for $0
      if (funding < 50_000_000) return [198, 219, 239, 200]; 
      if (funding < 250_000_000) return [158, 202, 225, 200];
      if (funding < 1_000_000_000) return [107, 174, 214, 200];
      if (funding < 5_000_000_000) return [49, 130, 189, 200];
      return [8, 81, 156, 200]; // Deep Blue for massive funding
    },
    updateTriggers: {
      getFillColor: [data] 
    }
  });

  if (!countiesReady || !bondsReady || !spatialReady || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
        <h1 className="text-xl tracking-widest animate-pulse">
          {!countiesReady || !bondsReady ? "Downloading data lake..." : !spatialReady ? "Loading GIS Engine..." : "Calculating Spatial Intersections..."}
        </h1>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-900">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={[layer]}
        getTooltip={({ object }: any) => {
          if (!object) return null;
          return `${object.properties.name} County\nFunding: ${formatMoney(object.properties.total_funding)}`;
        }}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
      </DeckGL>
    </div>
  );
}