import React, { useContext, useEffect, useRef } from "react";
import { MapContainer as LeafletMap, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useParcels from "../../hooks/useParcels";
import { ParcelContext } from "../../contexts/ParcelContext";
import logo from "../../assets/resim.webp";

const strokeDefault = { color: "blue", weight: 2, fillOpacity: 0.1 };
const strokeSelected = { color: "red", weight: 3, fillOpacity: 0.2 };

export default function MapContainer() {
  const { parcels } = useParcels();
  const {
    selectedParcel,
    setSelectedParcel,
    groupMode,
    setGroupMode,
    groupedParcels,
    toggleGroupParcel,
  } = useContext(ParcelContext);

  const mapRef = useRef(null);

  // Harita instance'ını garantiye almak için custom bir component
  function MapRefSync() {
    const map = useMap();
    mapRef.current = map;
    return null;
  }

  // Tekli seçimde seçili parsele uç
  useEffect(() => {
    if (!mapRef.current) return;
    if (!selectedParcel) return;
    const p = parcels.find((x) => x.id === selectedParcel);
    if (!p) return;
    const bounds = L.latLngBounds(p.koordinatlar);
    mapRef.current.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 0.35,
      maxZoom: 17,
    });
  }, [selectedParcel, parcels]);

  return (
    <div
      className="map-root"
      style={{ height: "100%", width: "100%", position: "relative" }}
    >
      {/* Grupla butonu (zoom butonlarının yanında) */}
      <div className="group-toggle">
        <label className="group-toggle-inner">
          <input
            type="checkbox"
            checked={groupMode}
            onChange={(e) => setGroupMode(e.target.checked)}
          />
          <span>Seç</span>
        </label>
      </div>

      <LeafletMap
        center={[38.26984, 27.3991]}
        zoom={16}
        minZoom={1}
        maxZoom={21}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapRefSync />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
          maxNativeZoom={18}
          maxZoom={21}
        />

        {parcels.map((parsel) => {
          const isSelected = groupMode
            ? groupedParcels.includes(parsel.id)
            : parsel.id === selectedParcel;

          return (
            <Polygon
              key={parsel.id}
              positions={parsel.koordinatlar}
              pathOptions={isSelected ? strokeSelected : strokeDefault}
              eventHandlers={{
                click: () => {
                  if (groupMode) {
                    toggleGroupParcel(parsel.id);
                  } else {
                    setSelectedParcel(parsel.id);
                  }
                },
              }}
            />
          );
        })}
      </LeafletMap>
            {/* Sol üst logo (tamamen geçişli) */}
      <div className="map-brand">
        <img src={logo} alt="Logo" />
      </div>
    </div>
  );
}
