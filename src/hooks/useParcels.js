import { useEffect, useState } from "react";
import vtparselData from "../assets/vtparsel.json";

// GeoJSON Polygon: [ [ [lng,lat], ... ] ]  -> Leaflet: [ [lat,lng], ... ]
function convertGeoJSONPolygons(features) {
  return features
    .filter(
      (f) =>
        f?.geometry?.type === "Polygon" &&
        Array.isArray(f.geometry.coordinates?.[0])
    )
    .map((feature, idx) => {
      const ring = feature.geometry.coordinates[0].map(([lng, lat]) => [
        lat,
        lng,
      ]);
      const pr = feature.properties || {};
      return {
        id: `${pr.adaNo || ""}_${pr.parselNo || ""}_${
          pr.mahalleAd || ""
        }_${idx}`,
        koordinatlar: ring,
        ada: pr.adaNo || "-",
        parsel: pr.parselNo || "-",
        mahalle: pr.mahalleAd || "-",
        alan: pr.alan || "-",
        properties: pr,
        info: feature.info || {},
      };
    });
}

export default function useParcels() {
  const [parcels, setParcels] = useState([]);
  useEffect(() => {
    setParcels(convertGeoJSONPolygons(vtparselData));
  }, []);
  return { parcels };
}
