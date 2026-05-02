import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Query, sql, useMosaicClient } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import Map, { ViewState } from 'react-map-gl/maplibre';
import { Table } from 'apache-arrow';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: -119.5,
  latitude: 37.0,
  zoom: 5.0, // Zoomed out slightly to see all of California
  pitch: 0,
  bearing: 0,
};

export default function MapView({className}: {className?: string}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // 1. Execute our REACTIVE spatial join query in DuckDB using Mosaic
  const { data, isLoading } = useMosaicClient<Table>({
    // 👇 FIX 1: Tell Mosaic to listen to the default global filters
    selectionName: 'brush', 
    query: (filter: any) => {
      const baseQuery = sql`
        WITH filtered_bonds AS (
          -- We use Mosaic's AST builder to automatically apply the UI filters!
          ${Query.from('bonds').select('IssuerCounty', 'PrincipalAmount').where(filter)}
        ),
        split_bonds AS (
          -- Unnest the semicolon-separated counties in your filtered data
          SELECT 
            UNNEST(string_split(IssuerCounty, '; ')) AS CountyName,
            PrincipalAmount
          FROM filtered_bonds
          WHERE IssuerCounty IS NOT NULL AND IssuerCounty != 'State of California'
        ),
        county_funding AS (
          -- Sum up total bond funding per county
          SELECT 
            CountyName,
            SUM(PrincipalAmount) AS Total_Bond_Funding
          FROM split_bonds
          GROUP BY CountyName
        )
        -- Join the financial aggregates to the geospatial boundaries
        SELECT 
          c.NAME10 AS CountyName,
          COALESCE(f.Total_Bond_Funding, 0) AS Funding_Amount,
          
          -- 👇 FIX 2: Bringing back our magic Web Mercator projection fix!
          ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(c.geometry, 'EPSG:3857', 'EPSG:4326'))) AS geojson
          
        FROM counties c
        LEFT JOIN county_funding f ON c.NAME10 = f.CountyName
      `;
      
      return Query.from(sql`(${baseQuery}) AS subquery`).select('*');
    }
  });

  // 2. Convert DuckDB results to standard GeoJSON for Deck.gl
  const geojsonData = useMemo(() => {
    if (!data) return null;
    const rows = data.toArray() as any[];
    
    // 👇 ADD THIS CONSOLE LOG HERE 👇
    if (rows.length > 0) {
       const geom = JSON.parse(rows[0].geojson);
       // Force the browser to print the actual coordinate numbers as a string!
       console.log("RAW NUMBERS:", JSON.stringify(geom.coordinates[0][0].slice(0, 3)));
    }
    
    return {
      type: 'FeatureCollection',
      features: rows.filter((r: any) => r.geojson).map((row: any) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geojson),
        properties: {
          CountyName: row.CountyName,
          Funding_Amount: row.Funding_Amount
        }
      }))
    } as any;
  }, [data]);

  // 3. Configure the Deck.gl Layer
  const polygonLayer = useMemo(() => {
    if (!geojsonData) return null;
    
    return new GeoJsonLayer({
      id: 'county-funding-layer',
      data: geojsonData,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 255],
      getFillColor: (d: any) => {
         const funding = d.properties.Funding_Amount || 0;
         // Scale color intensity based on funding amount
         const intensity = Math.min(255, (funding / 500000000) * 255);
         return [intensity, 50, 150, 200]; // Creates a nice blue scale
      }
    });
  }, [geojsonData]);

  return (
    <div className={cn('flex h-full w-full', className)}>
      <div className="relative flex-1">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({viewState: next}) => setViewState(next as ViewState)}
          controller={true}
          layers={[polygonLayer]}
          getTooltip={({object}: any) => {
            if (!object) return null;
            const props = object.properties;
            return {
              html: `
                <div style="font-family:system-ui; font-size:12px; padding:4px;">
                  <strong>${props.CountyName}</strong><br/>
                  Total Bond Funding: $${(props.Funding_Amount / 1000000).toFixed(2)}M
                </div>
              `
            };
          }}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        {/* Show a loading spinner while DuckDB does the heavy math */}
        {isLoading && (
          <div className="absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-black/40 text-white backdrop-blur-sm">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Crunching bond data & drawing counties...</span>
          </div>
        )}
      </div>
    </div>
  );
}