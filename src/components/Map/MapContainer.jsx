import React, { useContext, useEffect, useMemo, useRef } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Polygon,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import useParcels from "../../hooks/useParcels.js";
import { ParcelContext } from "../../contexts/ParcelContext.jsx";
import SelectedAreaInfo from "../SelectedAreaInfo.jsx";
import logo from "../../assets/resim.webp";

// (opsiyonel) marker iconları
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickClear({ onClick }) {
  useMapEvents({ click: () => onClick?.() }); // sadece harita boşluğunda çalışır (bubbling kapalı olduğunda)
  return null;
}

export default function MapContainer() {
  const { parcels } = useParcels();
  const { selectedParcel, setSelectedParcel } = useContext(ParcelContext);
  const mapRef = useRef(null);

  const selectedFeature = useMemo(
    () => parcels.find((p) => p.id === selectedParcel) || null,
    [selectedParcel, parcels]
  );

  useEffect(() => {
    if (selectedFeature && mapRef.current) {
      const bounds = L.latLngBounds(selectedFeature.koordinatlar);
      mapRef.current.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.3,
        maxZoom: 18,
      });
    }
  }, [selectedFeature]);

  useEffect(() => {
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    document.addEventListener("visibilitychange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onResize);
    };
  }, []);

  const baseStyle = { color: "blue", weight: 2 };
  const selStyle = { color: "red", weight: 4 };

  return (
    <>
      <LeafletMap
        className="leaflet-container"
        center={[38.2698378125, 27.3990990625]}
        zoom={17}
        minZoom={1}
        maxZoom={21}
        whenCreated={(map) => (mapRef.current = map)}
      >
        {/* Uydu (Esri) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          maxNativeZoom={18}
          maxZoom={21}
        />

        {/* Boş alana tıklandığında seçim temizle */}
        <MapClickClear onClick={() => setSelectedParcel(null)} />

        {/* Parseller */}
        {parcels.map((p) => (
          <Polygon
            key={p.id}
            positions={p.koordinatlar}
            /* 🔑 bubbling kapalı: poligona tıklayınca Map click çalışmaz */
            pathOptions={{
              ...(selectedParcel === p.id ? selStyle : baseStyle),
              bubblingMouseEvents: false,
            }}
            eventHandlers={{
              click: (e) => {
                // 🔒 DOM event’ini kesin durdur
                if (e?.originalEvent) {
                  e.originalEvent.preventDefault?.();
                  e.originalEvent.stopPropagation?.();
                  // Leaflet helper (DOM event ile kullan)
                  L.DomEvent.stop(e.originalEvent);
                }
                setSelectedParcel(p.id);
              },
            }}
          />
        ))}
      </LeafletMap>

      {/* Sol üst logo (tamamen geçişli) */}
      <div className="map-brand">
        <img src={logo} alt="Logo" />
      </div>

      {/* Alt bilgi çubuğu */}
      <SelectedAreaInfo parcel={selectedFeature} />
    </>
  );
}
