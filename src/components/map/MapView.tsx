import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Query, sql, useMosaicClient } from '@sqlrooms/mosaic';
import { cn } from '@sqlrooms/ui';
import { Loader2, Layers, Compass, ChevronDown, ChevronRight, Activity } from 'lucide-react'; 
import { useMemo, useState, useEffect } from 'react';
import Map, { ViewState } from 'react-map-gl/maplibre';
import { Table } from 'apache-arrow';
import { useRoomStore } from '../../store';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: -119.5,
  latitude: 37.0,
  zoom: 5.0, 
  pitch: 0,
  bearing: 0,
};

// --- DOMAIN 1: MUNI BONDS (Independent Districts) ---
const DISTRICT_OPTIONS = [
  { label: 'None', file: null },
  { label: 'School Districts', file: 'School_Districts_2425' },
  { label: 'Medical Service Study Areas (MSSA)', file: 'Medical_Service_Study_Areas' },
  { label: 'Airport', file: 'Special_Districts_Airport' },
  { label: 'Airport (Points)', file: 'Special_Districts_Airport_Points' },
  { label: 'AQMD Air Pollution (Points)', file: 'Special_Districts_AQMD_AirPollution_Points' },
  { label: 'Cemetery', file: 'Special_Districts_Cemetery' },
  { label: 'Cemetery (Points)', file: 'Special_Districts_Cemetery_Points' },
  { label: 'Community Services (CSD)', file: 'Special_Districts_CSD' },
  { label: 'Community Services (CSD) (Points)', file: 'Special_Districts_CSD_Points' },
  { label: 'Fire Protection', file: 'Special_Districts_Fire' },
  { label: 'Fire Protection (Points)', file: 'Special_Districts_Fire_Points' },
  { label: 'Flood & Drainage', file: 'Special_Districts_Flood_Drainage' },
  { label: 'Flood & Drainage (Points)', file: 'Special_Districts_Flood_Drainage_Points' },
  { label: 'Harbor', file: 'Special_Districts_Harbor' },
  { label: 'Harbor (Points)', file: 'Special_Districts_Harbor_Points' },
  { label: 'Health Care', file: 'Special_Districts_HealthCare' },
  { label: 'Health Care (Points)', file: 'Special_Districts_HealthCare_Points' },
  { label: 'Irrigation', file: 'Special_Districts_Irrigation' },
  { label: 'Irrigation (Points)', file: 'Special_Districts_Irrigation_Points' },
  { label: 'Library', file: 'Special_Districts_Library' },
  { label: 'Library (Points)', file: 'Special_Districts_Library_Points' },
  { label: 'Memorial', file: 'Special_Districts_Memorial' },
  { label: 'Memorial (Points)', file: 'Special_Districts_Memorial_Points' },
  { label: 'Mosquito & Vector Control', file: 'Special_Districts_Mosquito_Vector_Control' },
  { label: 'Mosquito & Vector Control (Points)', file: 'Special_Districts_Mosquito_Vector_Control_Points' },
  { label: 'Municipal Resort Improvement', file: 'Special_Districts_Municipal_ResortImprovement' },
  { label: 'Municipal Resort Improvement (Points)', file: 'Special_Districts_Municipal_ResortImprovement_Points' },
  { label: 'Open Space', file: 'Special_Districts_OpenSpace' },
  { label: 'Open Space (Points)', file: 'Special_Districts_OpenSpace_Points' },
  { label: 'Other', file: 'Special_Districts_Other' },
  { label: 'Other (Points)', file: 'Special_Districts_Other_Points' },
  { label: 'Parks & Recreation', file: 'Special_Districts_ParkRec' },
  { label: 'Parks & Recreation (Points)', file: 'Special_Districts_ParkRec_Points' },
  { label: 'Police Protection & Ambulance', file: 'Special_Districts_PoliceProtection_Ambulance' },
  { label: 'Police Protection & Ambulance (Points)', file: 'Special_Districts_PoliceProtection_Ambulance_Points' },
  { label: 'Public Utilities', file: 'Special_Districts_PublicUtilities' },
  { label: 'Public Utilities (Points)', file: 'Special_Districts_PublicUtilities_Points' },
  { label: 'Reclamation', file: 'Special_Districts_Reclamation' },
  { label: 'Reclamation (Points)', file: 'Special_Districts_Reclamation_Points' },
  { label: 'Resource', file: 'Special_Districts_Resource' },
  { label: 'Resource (Points)', file: 'Special_Districts_Resource_Points' },
  { label: 'Sanitary', file: 'Special_Districts_Sanitary' },
  { label: 'Sanitary (Points)', file: 'Special_Districts_Sanitary_Points' },
  { label: 'Waste Management', file: 'Special_Districts_WasteManagement' },
  { label: 'Waste Management (Points)', file: 'Special_Districts_WasteManagement_Points' },
  { label: 'Water', file: 'Special_Districts_Water' },
  { label: 'Water (Points)', file: 'Special_Districts_Water_Points' },
];

// --- DOMAIN 2: ESG / PUBLIC HEALTH (CalEnviroScreen & Add'l Data) ---
const ESG_OPTIONS = [
  { label: 'None', file: null },
  { label: 'Asthma Rates', file: 'asthma/ces5_asthma' },
  { label: 'Cardiovascular Disease', file: 'cardiovascular/ces5_cardiovascular' },
  { label: 'Children Lead Housing Risk', file: 'children_lead_housing_risk/ces5_final_lead_housing_index' },
  { label: 'Cleanup Sites', file: 'cleanup_sites/ces5_cleanup_sites' },
  { label: 'Diabetes', file: 'diabetes/places_diabetes' },
  { label: 'Diesel HDV', file: 'disel_hdv/master_diesel_hdv' },
  { label: 'Drinking Water Threats', file: 'drinking_water/ces5_drinking_water' },
  { label: 'Groundwater Threats', file: 'groundwater_threats/ces5_groundwater_threats' },
  { label: 'Hazardous Waste', file: 'hazardous_waste/ces5_hazardous_waste' },
  { label: 'Impaired Waters', file: 'impaired_waters/ces5_impaired_waters' },
  { label: 'Low Birth Weight', file: 'low_birth_weight/ces5_low_birth_weight' },
  { label: 'Ozone (Air Quality)', file: 'air_quality/ozone/ozone_historical_mapped' },
  { label: 'PM 2.5 (Air Quality)', file: 'air_quality/pm25/pm25_historical_mapped' },
  { label: 'Pesticides', file: 'pesticides/master_pesticide_air_monitoring_mapped' },
  { label: 'SMATS', file: 'smats/ces5_smats' },
  { label: 'Socioeconomic Factors (ACS)', file: 'census_socioeconomic/acs_2022_socioeconomic' },
  { label: 'Toxic Releases', file: 'toxic_releases/ces5_toxic_releases' },
  { label: 'Traffic Density', file: 'traffic/ces5_traffic' },
  { label: 'TRI Facilities (Points)', file: 'tri/tri_facilities' },
];

export default function MapView({className}: {className?: string}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isExploreOpen, setIsExploreOpen] = useState(true);
  
  const [districtGeoJson, setDistrictGeoJson] = useState<any>(null);
  const [isLoadingDistrict, setIsLoadingDistrict] = useState(false);
  const [esgGeoJson, setEsgGeoJson] = useState<any>(null);
  const [isLoadingEsg, setIsLoadingEsg] = useState(false);
  const [esgCountyGeoJson, setEsgCountyGeoJson] = useState<any>(null);

  const mapDomain = useRoomStore((state) => state.mapDomain);
  const setMapDomain = useRoomStore((state) => state.setMapDomain);
  const activeDistrict = useRoomStore((state) => state.activeDistrict);
  const setActiveDistrict = useRoomStore((state) => state.setActiveDistrict);
  const activeEsgLayer = useRoomStore((state) => state.activeEsgLayer);
  const setActiveEsgLayer = useRoomStore((state) => state.setActiveEsgLayer);
  const esgYear = useRoomStore((state) => state.esgYear);
  const setEsgYear = useRoomStore((state) => state.setEsgYear);
  const ozoneMetric = useRoomStore((state) => state.ozoneMetric);
  const setOzoneMetric = useRoomStore((state) => state.setOzoneMetric);
  const setSelectedFeature = useRoomStore((state) => state.setSelectedFeature);
  const duckdb = useRoomStore((state) => state.db.connector);

  // 1. BASE DEBT QUERY 
  const { data, isLoading } = useMosaicClient<Table>({
    selectionName: 'brush', 
    query: (filter: any) => {
      const baseQuery = sql`
        WITH filtered_bonds AS (
          ${Query.from('bonds').select('CDIACNumber', 'IssuerCounty', 'PrincipalAmount').where(filter)}
        ),
        local_bonds AS (
          SELECT CDIACNumber, PrincipalAmount, UNNEST(string_split(IssuerCounty, '; ')) AS CountyName
          FROM filtered_bonds WHERE IssuerCounty IS NOT NULL AND IssuerCounty != 'State of California'
        ),
        local_weighted AS (
          SELECT l.CDIACNumber, l.CountyName, l.PrincipalAmount * (p.Population / SUM(p.Population) OVER (PARTITION BY l.CDIACNumber)) AS WeightedAmount
          FROM local_bonds l JOIN county_populations p ON l.CountyName = p.CountyName
        ),
        state_bonds AS (
          SELECT CDIACNumber, PrincipalAmount FROM filtered_bonds WHERE IssuerCounty = 'State of California'
        ),
        state_weighted AS (
          SELECT s.CDIACNumber, p.CountyName, s.PrincipalAmount * (p.Population / (SELECT SUM(Population) FROM county_populations)) AS WeightedAmount
          FROM state_bonds s CROSS JOIN county_populations p
        ),
        all_weighted AS (
          SELECT CountyName, WeightedAmount FROM local_weighted UNION ALL SELECT CountyName, WeightedAmount FROM state_weighted
        ),
        county_funding AS (
          SELECT CountyName, SUM(WeightedAmount) AS Total_Bond_Funding FROM all_weighted GROUP BY CountyName
        )
        SELECT c.NAME10 AS CountyName, COALESCE(f.Total_Bond_Funding, 0) AS Funding_Amount, ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(c.geometry, 'EPSG:3857', 'EPSG:4326'))) AS geojson
        FROM counties c LEFT JOIN county_funding f ON c.NAME10 = f.CountyName
      `;
      return Query.from(sql`(${baseQuery}) AS subquery`).select('*');
    }
  });

  const geojsonData = useMemo(() => {
    if (!data) return null;
    const rows = data.toArray() as any[];
    return {
      type: 'FeatureCollection',
      features: rows.filter((r: any) => r.geojson).map((row: any) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geojson),
        properties: { CountyName: row.CountyName, Funding_Amount: row.Funding_Amount, domain: 'bonds' } 
      }))
    } as any;
  }, [data]);

  // 2. FETCH INDEPENDENT DISTRICTS ON DEMAND
  useEffect(() => {
    if (!activeDistrict || !duckdb || mapDomain !== 'bonds') {
      setDistrictGeoJson(null);
      return;
    }
    async function fetchDistrictLayer() {
      setIsLoadingDistrict(true);
      try {
        const fileUrl = `${window.location.origin}/data/geometries/${activeDistrict}.parquet`;
        const isStandardGPS = activeDistrict === 'School_Districts_2425' || activeDistrict === 'Medical_Service_Study_Areas';
        const geomColumn = isStandardGPS 
          ? "ST_AsGeoJSON(geometry)" 
          : "ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(geometry, 'EPSG:3857', 'EPSG:4326')))";

        const query = `SELECT ${geomColumn} as feature, * EXCLUDE (geometry) FROM read_parquet('${fileUrl}')`;
        const result = await duckdb?.query(query);
        if (result) {
          const features = result.toArray().map((row: any) => ({
            type: 'Feature', geometry: JSON.parse(row.feature), properties: { ...row, domain: 'district' }
          }));
          setDistrictGeoJson({ type: 'FeatureCollection', features });
        }
      } catch (error) {
        console.error("Failed to load district layer:", error);
      } finally {
        setIsLoadingDistrict(false);
      }
    }
    fetchDistrictLayer();
  }, [activeDistrict, duckdb, mapDomain]);

  // --- 3. FETCH ESG METRICS AND JOIN TO CENSUS TRACTS ---
  useEffect(() => {
    if (!activeEsgLayer || !duckdb || mapDomain !== 'esg') {
      setEsgGeoJson(null);
      setEsgCountyGeoJson(null); 
      return;
    }

    async function fetchEsgLayer() {
      setIsLoadingEsg(true);
      try {
        const origin = window.location.origin;
        const metricUrl = `${origin}/data/enviroscreen/${activeEsgLayer}.parquet`;
        const isPointData = activeEsgLayer?.includes('facilities') || activeEsgLayer?.includes('mapped');

        setEsgCountyGeoJson(null); 

        let query = '';
        let countyQuery = ''; 

        if (activeEsgLayer?.includes('tri_facilities')) {
          query = `
            SELECT ST_AsGeoJSON(ST_Point("13. LONGITUDE", "12. LATITUDE")) as feature, * FROM read_parquet('${metricUrl}')
            WHERE "13. LONGITUDE" IS NOT NULL AND "12. LATITUDE" IS NOT NULL
          `;
        } else if (isPointData) {
          const yearFilter = activeEsgLayer?.includes('air_quality') ? `AND Year = ${esgYear}` : '';
          
          query = `
            SELECT ST_AsGeoJSON(ST_Point(Longitude, Latitude)) as feature, * FROM read_parquet('${metricUrl}')
            WHERE Longitude IS NOT NULL AND Latitude IS NOT NULL ${yearFilter}
          `;

          if (activeEsgLayer?.includes('ozone')) {
            countyQuery = `
              SELECT 
                ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(c.geometry, 'EPSG:3857', 'EPSG:4326'))) as feature,
                c.NAME10 as County,
                MAX(m.Max_8hr_Ozone) as Max_8hr_Ozone,
                MAX(m.Exceedance_Days_070) as Exceedance_Days_070
              FROM counties c
              JOIN read_parquet('${metricUrl}') m ON c.NAME10 = m.County
              WHERE m.Year = ${esgYear}
              GROUP BY c.NAME10, c.geometry
            `;
          } else if (activeEsgLayer?.includes('pm25')) {
             // 🧠 PM 2.5 County Background Query
            countyQuery = `
              SELECT 
                ST_AsGeoJSON(ST_FlipCoordinates(ST_Transform(c.geometry, 'EPSG:3857', 'EPSG:4326'))) as feature,
                c.NAME10 as County,
                MAX(m.Daily_Avg_PM25) as Daily_Avg_PM25,
                MAX(m.Days_Above_Std) as Days_Above_Std
              FROM counties c
              JOIN read_parquet('${metricUrl}') m ON c.NAME10 = m.County
              WHERE m.Year = ${esgYear}
              GROUP BY c.NAME10, c.geometry
            `;
          }
        } else {
          const tractsUrl = `${origin}/data/enviroscreen/geometries/ca_tracts_clean.parquet`;
          const joinKey = activeEsgLayer?.includes('diabetes') ? 'Tract' : 'Census_Tract';
          
          query = `
            SELECT ST_AsGeoJSON(t.geometry) as feature, m.* EXCLUDE (${joinKey})
            FROM read_parquet('${tractsUrl}') t
            JOIN read_parquet('${metricUrl}') m ON t.Census_Tract = m.${joinKey}
          `;
        }

        const result = await duckdb?.query(query);
        if (result) {
          const features = result.toArray().map((row: any) => ({
            type: 'Feature', geometry: JSON.parse(row.feature), properties: { ...row, domain: 'esg' }
          }));
          setEsgGeoJson({ type: 'FeatureCollection', features });
        }

        if (countyQuery) {
          const countyResult = await duckdb?.query(countyQuery);
          if (countyResult) {
            const cFeatures = countyResult.toArray().map((row: any) => ({
              type: 'Feature', geometry: JSON.parse(row.feature), properties: { ...row, domain: 'esg_county' }
            }));
            setEsgCountyGeoJson({ type: 'FeatureCollection', features: cFeatures });
          }
        }

      } catch (error) {
        console.error("Failed to load ESG layer:", error);
      } finally {
        setIsLoadingEsg(false);
      }
    }

    fetchEsgLayer();
  }, [activeEsgLayer, duckdb, mapDomain, esgYear]);


  // 4. DECK.GL LAYERS
  const polygonLayer = useMemo(() => {
    if (!geojsonData || mapDomain !== 'bonds') return null;
    return new GeoJsonLayer({
      id: 'county-funding-layer',
      data: geojsonData,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 30],
      getFillColor: (d: any) => {
         const funding = d.properties.Funding_Amount || 0;
         if (funding === 0) return [0, 0, 0, 0]; 
         if (funding < 1_000_000_000) return [16, 185, 129, 150]; 
         if (funding < 5_000_000_000) return [234, 179, 8, 180]; 
         if (funding < 10_000_000_000) return [249, 115, 22, 200]; 
         return [239, 68, 68, 220]; 
      },
      updateTriggers: { getFillColor: [geojsonData] }
    });
  }, [geojsonData, mapDomain]);

  const specialDistrictLayer = useMemo(() => {
    if (!districtGeoJson || mapDomain !== 'bonds') return null;
    return new GeoJsonLayer({
      id: 'special-district-layer',
      data: districtGeoJson,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      pointRadiusMinPixels: 4, 
      getPointRadius: 1500, 
      getLineColor: [34, 211, 238, 255], 
      getFillColor: [34, 211, 238, 40], 
    });
  }, [districtGeoJson, mapDomain]);

  const esgCountyLayer = useMemo(() => {
    if (!esgCountyGeoJson || mapDomain !== 'esg') return null;
    return new GeoJsonLayer({
      id: 'esg-county-layer',
      data: esgCountyGeoJson,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 30],
      getFillColor: (d: any) => {
         const props = d.properties;
         
         // Ozone Coloring
         if (activeEsgLayer?.includes('ozone')) {
           if (ozoneMetric === 'exceedance') {
             const days = Number(props.Exceedance_Days_070) || 0;
             if (days === 0) return [16, 185, 129, 100]; 
             if (days <= 5) return [234, 179, 8, 120];    
             if (days <= 15) return [249, 115, 22, 140];  
             return [239, 68, 68, 160];                   
           } else {
             const conc = Number(props.Max_8hr_Ozone) || 0;
             if (conc < 0.070) return [16, 185, 129, 100]; 
             if (conc <= 0.075) return [234, 179, 8, 120]; 
             if (conc <= 0.085) return [249, 115, 22, 140];
             return [239, 68, 68, 160];                    
           }
         } 
         // 🧠 PM 2.5 County Coloring
         else if (activeEsgLayer?.includes('pm25')) {
           const days = Number(props.Days_Above_Std) || 0;
           if (days === 0) return [16, 185, 129, 100]; 
           if (days <= 2) return [234, 179, 8, 120];    
           if (days <= 10) return [249, 115, 22, 140];  
           return [239, 68, 68, 160];  
         }
         return [0,0,0,0];
      },
      updateTriggers: { getFillColor: [ozoneMetric, activeEsgLayer] }
    });
  }, [esgCountyGeoJson, mapDomain, ozoneMetric, activeEsgLayer]);

  const esgLayer = useMemo(() => {
    if (!esgGeoJson || mapDomain !== 'esg') return null;
    return new GeoJsonLayer({
      id: 'esg-metric-layer',
      data: esgGeoJson,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      pointRadiusMinPixels: 4, 
      getPointRadius: (d: any) => {
        const props = d.properties;
        if (activeEsgLayer?.includes('ozone')) {
          if (ozoneMetric === 'exceedance') return 1000 + (Number(props.Exceedance_Days_070 || 0) * 100); 
          else return 1000 + (Number(props.Max_8hr_Ozone || 0) * 50000);
        } else if (activeEsgLayer?.includes('pm25')) {
          return 1000 + (Number(props.Days_Above_Std || 0) * 500);
        }
        return 2500;
      },
      getLineColor: [255, 255, 255, 20],
      getFillColor: (d: any) => {
         const props = d.properties;
         if (activeEsgLayer?.includes('ozone')) {
           if (ozoneMetric === 'exceedance') {
             const days = Number(props.Exceedance_Days_070) || 0;
             if (days === 0) return [16, 185, 129, 200];  
             if (days <= 5) return [234, 179, 8, 200];    
             if (days <= 15) return [249, 115, 22, 220];  
             return [239, 68, 68, 240];                   
           } else {
             const conc = Number(props.Max_8hr_Ozone) || 0;
             if (conc < 0.070) return [16, 185, 129, 200]; 
             if (conc <= 0.075) return [234, 179, 8, 200]; 
             if (conc <= 0.085) return [249, 115, 22, 220];
             return [239, 68, 68, 240];                    
           }
         } else if (activeEsgLayer?.includes('pm25')) {
             const days = Number(props.Days_Above_Std) || 0;
             if (days === 0) return [16, 185, 129, 200];  
             if (days <= 2) return [234, 179, 8, 200];    
             if (days <= 10) return [249, 115, 22, 220];  
             return [239, 68, 68, 240]; 
         }
         
         const pctKey = Object.keys(props).find(k => 
           k.toLowerCase().includes('percentile') || 
           k.toLowerCase().includes('pctl') || 
           k.toLowerCase().includes('score')
         );
         
         if (pctKey) {
            const score = Number(props[pctKey]) || 0;
            if (score < 25) return [16, 185, 129, 180]; 
            if (score < 50) return [234, 179, 8, 180];  
            if (score < 75) return [249, 115, 22, 200]; 
            return [239, 68, 68, 220];                  
         }

         if (props.Total_Lead_Risk_Factors !== undefined) {
            const risk = Number(props.Total_Lead_Risk_Factors) || 0;
            if (risk <= 1) return [16, 185, 129, 180];
            if (risk <= 3) return [234, 179, 8, 180];
            if (risk <= 5) return [249, 115, 22, 200];
            return [239, 68, 68, 220];
         }

         if (props.Count_Below_Poverty !== undefined) {
            const pov = Number(props.Count_Below_Poverty) || 0;
            if (pov < 500) return [16, 185, 129, 180];
            if (pov < 1000) return [234, 179, 8, 180];
            if (pov < 2000) return [249, 115, 22, 200];
            return [239, 68, 68, 220];
         }

         return [34, 211, 238, 200]; 
      },
      updateTriggers: {
        getFillColor: [ozoneMetric, activeEsgLayer],
        getPointRadius: [ozoneMetric, activeEsgLayer]
      }
    });
  }, [esgGeoJson, mapDomain, activeEsgLayer, ozoneMetric]);

  return (
    <div className={cn('flex h-full w-full', className)}>
      <div className="relative flex-1">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({viewState: next}) => setViewState(next as ViewState)}
          controller={true}
          layers={[polygonLayer, specialDistrictLayer, esgCountyLayer, esgLayer]}
          onClick={({object}: any) => {
            if (object && object.properties) {
              setSelectedFeature(object.properties);
            } else {
              setSelectedFeature(null); 
            }
          }}
          getTooltip={({object}: any) => {
            if (!object) return null;
            const props = object.properties;

            if (mapDomain === 'bonds' && props.CountyName) {
              const fundingInBillions = (props.Funding_Amount / 1_000_000_000).toFixed(2);
              return {
                html: `<div style="font-family:system-ui; font-size:12px; padding:4px;"><strong>${props.CountyName}</strong><br/>Total Bond Funding: $${fundingInBillions}B</div>`
              };
            }

            if (mapDomain === 'esg') {
              // 🧠 PM 2.5 Tooltips
              if (activeEsgLayer?.includes('pm25')) {
                if (props.County && !props.Monitor_Name) {
                  return {
                    html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                             <strong>${props.County} County (Worst PM 2.5)</strong><br/>
                             Max 1-Day Avg: ${props.Daily_Avg_PM25 || 'N/A'} µg/m³<br/>
                             Days Above Std: ${props.Days_Above_Std || 0}
                           </div>`
                  }
                }
                if (props.Monitor_Name) {
                  return {
                    html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                             <strong>Monitor:</strong> ${props.Monitor_Name}<br/>
                             County: ${props.County}<br/>
                             Max 1-Day Avg: ${props.Daily_Avg_PM25 || 'N/A'} µg/m³<br/>
                             Days Above Std: ${props.Days_Above_Std || 0}
                           </div>`
                  }
                }
              }

              // Ozone Tooltips
              if (activeEsgLayer?.includes('ozone')) {
                if (props.County && !props.Monitor_Name) {
                  return {
                    html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                             <strong>${props.County} County (Highest Monitor)</strong><br/>
                             Max 8hr Ozone: ${props.Max_8hr_Ozone || 'N/A'} ppm<br/>
                             Exceedance Days (0.070): ${props.Exceedance_Days_070 || 0}
                           </div>`
                  }
                }
                if (props.Monitor_Name) {
                  return {
                    html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                             <strong>Monitor:</strong> ${props.Monitor_Name}<br/>
                             County: ${props.County}<br/>
                             Max 8hr Ozone: ${props.Max_8hr_Ozone || 'N/A'} ppm<br/>
                             Exceedance Days (0.070): ${props.Exceedance_Days_070 || 0}
                           </div>`
                  }
                }
              }

              // 👇 NEW: Asthma Tooltip (Multiple numbers, cleanly rounded)
              if (activeEsgLayer?.includes('asthma') && props.Asthma_ER_Rate) {
                return {
                  html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                           <strong>Tract:</strong> ${props.Census_Tract || props.Tract}<br/>
                           <strong>ER Visit Rate:</strong> ${Number(props.Asthma_ER_Rate).toFixed(1)}<br/>
                           <strong>State Percentile:</strong> ${Number(props.Asthma_Percentile).toFixed(1)}
                         </div>`
                };
              }

              // 👇 NEW: Cardiovascular Tooltip (Multiple numbers, cleanly rounded)
              if (activeEsgLayer?.includes('cardiovascular') && props.Cardiovascular_ER_Rate) {
                return {
                  html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                           <strong>Tract:</strong> ${props.Census_Tract || props.Tract}<br/>
                           <strong>ER Visit Rate:</strong> ${Number(props.Cardiovascular_ER_Rate).toFixed(1)}<br/>
                           <strong>State Percentile:</strong> ${Number(props.Cardiovascular_Percentile).toFixed(1)}
                         </div>`
                };
              }

              // Other Tooltips
              if (props['4. FACILITY NAME']) {
                return {
                  html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                           <strong>${props['4. FACILITY NAME']}</strong><br/>
                           Industry: ${props['23. INDUSTRY SECTOR']}<br/>
                           Total Releases: ${props['107. TOTAL RELEASES']} ${props['50. UNIT OF MEASURE']}
                         </div>`
                }
              }

              const metricKey = Object.keys(props).find(k => 
                k.toLowerCase().includes('percentile') || 
                k.toLowerCase().includes('pctl') || 
                k.toLowerCase().includes('score') ||
                k === 'Total_Lead_Risk_Factors' || 
                k === 'Count_Below_Poverty' ||
                k === 'Elevated_BLL_Percent'
              );
              
              if (metricKey) {
                const rawValue = props[metricKey];
                const displayValue = (!isNaN(Number(rawValue)) && Number(rawValue) % 1 !== 0) 
                  ? Number(rawValue).toFixed(1) 
                  : rawValue;

                return {
                  html: `<div style="font-family:system-ui; font-size:12px; padding:4px;">
                           <strong>${metricKey.replace(/_/g, ' ')}:</strong> ${displayValue}
                         </div>`
                };
              }
            }
            return null;
          }}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        {/* --- EXPLORE HUB --- */}
        <div className="absolute top-20 left-6 z-20 pointer-events-auto w-72 flex flex-col gap-2">
          
          <button 
            onClick={() => setIsExploreOpen(!isExploreOpen)}
            className="flex items-center justify-between w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 shadow-lg text-white hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center gap-2 font-bold tracking-wide text-sm">
              <Compass size={18} className="text-indigo-400" /> EXPLORE DATA
            </div>
            {isExploreOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <div className={cn("flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out", isExploreOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}>
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl p-4 flex flex-col gap-4">
              
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button 
                  onClick={() => setMapDomain('bonds')}
                  className={cn("flex-1 text-xs font-bold py-2 rounded-md transition-all", mapDomain === 'bonds' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white")}
                >
                  MUNI BONDS
                </button>
                <button 
                  onClick={() => setMapDomain('esg')}
                  className={cn("flex-1 text-xs font-bold py-2 rounded-md transition-all", mapDomain === 'esg' ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white")}
                >
                  ESG
                </button>
              </div>

              {mapDomain === 'bonds' && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-2 text-white mb-3 border-b border-slate-700/50 pb-2">
                    <Layers size={16} className="text-cyan-400" />
                    <h3 className="font-bold tracking-wide text-xs uppercase">Independent Districts</h3>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {DISTRICT_OPTIONS.map((option) => (
                      <button
                        key={option.label} onClick={() => setActiveDistrict(option.file)}
                        className={cn("text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border", activeDistrict === option.file ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800/30 text-slate-300 border-transparent hover:bg-slate-700/50 hover:text-white')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {isLoadingDistrict && <div className="mt-4 flex items-center justify-center text-xs text-cyan-400 font-bold tracking-widest"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> LOADING...</div>}
                </div>
              )}

              {mapDomain === 'esg' && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2 text-white mb-3 border-b border-slate-700/50 pb-2">
                    <Activity size={16} className="text-rose-400" />
                    <h3 className="font-bold tracking-wide text-xs uppercase">Public Health Focus</h3>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {ESG_OPTIONS.map((option) => (
                      <div key={option.label} className="flex flex-col gap-1">
                        <button
                          onClick={() => setActiveEsgLayer(option.file)}
                          className={cn("text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border", activeEsgLayer === option.file ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-800/30 text-slate-300 border-transparent hover:bg-slate-700/50 hover:text-white')}
                        >
                          {option.label}
                        </button>

                        {/* Ozone Specific Controls */}
                        {activeEsgLayer === option.file && option.label.includes('Ozone') && (
                          <div className="animate-in slide-in-from-top-2 flex flex-col gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800 ml-2 mb-1">
                            <div className="flex bg-slate-900 rounded-md p-1 border border-slate-700">
                              <button 
                                onClick={() => setOzoneMetric('exceedance')}
                                className={cn("flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-all", ozoneMetric === 'exceedance' ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200")}
                              >
                                Exceedance Days
                              </button>
                              <button 
                                onClick={() => setOzoneMetric('concentration')}
                                className={cn("flex-1 text-[10px] uppercase font-bold py-1.5 rounded transition-all", ozoneMetric === 'concentration' ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200")}
                              >
                                Max Concentration
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Timeline</span>
                                <span className="text-white font-bold">{esgYear}</span>
                              </div>
                              <input 
                                type="range" min="2006" max="2026" step="1"
                                value={esgYear}
                                onChange={(e) => setEsgYear(Number(e.target.value))}
                                className="w-full accent-rose-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* PM 2.5 Specific Controls */}
                        {activeEsgLayer === option.file && option.label.includes('PM 2.5') && (
                          <div className="animate-in slide-in-from-top-2 flex flex-col gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800 ml-2 mb-1">
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Timeline</span>
                                <span className="text-white font-bold">{esgYear}</span>
                              </div>
                              <input 
                                type="range" min="2006" max="2026" step="1"
                                value={esgYear}
                                onChange={(e) => setEsgYear(Number(e.target.value))}
                                className="w-full accent-rose-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isLoadingEsg && <div className="mt-4 flex items-center justify-center text-xs text-rose-400 font-bold tracking-widest"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> COMPILING HAZARDS...</div>}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Global base loading spinner */}
        {isLoading && (
          <div className="absolute left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-black/40 text-white backdrop-blur-sm pointer-events-none">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Crunching bond data & drawing counties...</span>
          </div>
        )}
      </div>
    </div>
  );
}