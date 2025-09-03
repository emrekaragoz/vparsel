import { useEffect, useState } from "react";
import vtparselData from "../assets/vtparsel.json";

function getFeatures(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.features)) return input.features;
  return [];
}

function normalizeFeatures(raw) {
  const features = getFeatures(raw);
  const out = [];

  features.forEach((feature, idx) => {
    const props = feature?.properties || {};
    const info = feature?.info || props?.info || {};

    let ringLngLat =
      feature?.geometry?.type === "Polygon"
        ? feature?.geometry?.coordinates?.[0]
        : feature?.geometry?.type === "MultiPolygon"
        ? feature?.geometry?.coordinates?.[0]?.[0]
        : null;

    if (!Array.isArray(ringLngLat) || ringLngLat.length === 0) return;

    const koordinatlar = ringLngLat.map(([lng, lat]) => [lat, lng]);

    const id =
      feature?.id ??
      `${props.adaNo || ""}_${props.parselNo || ""}_${
        props.mahalleAd || ""
      }_${idx}`;

    out.push({
      id,
      koordinatlar,
      ada: props.adaNo,
      parsel: props.parselNo,
      mahalle: props.mahalleAd,
      alan: props.alan,
      ilce: props.ilceAd,
      mevkii: props.mevkii,
      pafta: props.pafta,
      nitelik: props.nitelik,
      info,
      properties: props,
    });
  });

  return out;
}

export default function useParcels() {
  const [parcels, setParcels] = useState([]);
  useEffect(() => {
    setParcels(normalizeFeatures(vtparselData));
  }, []);
  return { parcels };
}
