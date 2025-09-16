import React, { useContext, useEffect, useMemo } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  Polygon,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useParcels from "../../hooks/useParcels";
import { ParcelContext } from "../../contexts/ParcelContext";
import logo from "../../assets/resim.webp";

/** Seçime göre haritayı odaklar (tekli / çoklu) */
function FocusController({ parcels, selectedParcel, groupMode, groupedParcels }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (groupMode && groupedParcels?.length > 0) {
      const points = [];
      groupedParcels.forEach((id) => {
        const p = parcels.find((x) => x.id === id);
        if (p?.koordinatlar?.length) points.push(...p.koordinatlar);
      });
      if (points.length) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [100, 50], maxZoom: 17 });
      }
      return;
    }

    if (selectedParcel) {
      const p = parcels.find((x) => x.id === selectedParcel);
      if (p?.koordinatlar?.length) {
        const bounds = L.latLngBounds(p.koordinatlar);
        map.fitBounds(bounds, { padding: [100, 50], maxZoom: 17 });
      }
    }
  }, [map, parcels, selectedParcel, groupMode, groupedParcels]);

  return null;
}

/* ---------------- Durum/renk/ikon yardımcıları ---------------- */

const STATUS_MAP = {
  yapildi:   { color: "#22c55e", symbol: "✓",  title: "Yapıldı" },
  beklemede: { color: "#f59e0b", symbol: "🕒", title: "Beklemede" },
  gecikti:   { color: "#ef4444", symbol: "❗", title: "Zamanı Geçti" },
};

// "Yapıldı" | "Beklemede" | "Zamanı Geçti" → anahtar
function normStatus(v) {
  if (!v) return null;
  const s = String(v).toLowerCase("tr-TR");
  if (s.includes("yap")) return "yapildi";
  if (s.includes("bekle")) return "beklemede";
  if (s.includes("geç") || s.includes("gec")) return "gecikti";
  return null;
}

function parseDate(d) {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : -Infinity;
}

// Dizi içinden en güncel tarihli kaydı bul
function latestByDate(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const withIndex = arr.map((e, i) => ({ e, i, ts: parseDate(e?.tarih) }));
  withIndex.sort((a, b) => b.ts - a.ts || b.i - a.i);
  return withIndex[0].e;
}

// İlgili moda göre (ilac/gubre) parsel statüsü
function getParcelStatus(parcel, mapMode) {
  let src = null;
  if (mapMode === "ilac")  src = parcel?.info?.ilaclama || parcel?.properties?.ilaclama;
  if (mapMode === "gubre") src = parcel?.info?.gubre     || parcel?.properties?.gubre;
  if (!Array.isArray(src) || src.length === 0) return null;

  const latest = latestByDate(src);
  const key = normStatus(latest?.durum);
  if (!key) return null;

  return { key, ...STATUS_MAP[key] };
}

/* ---------------- /Durum yardımcıları ---------------- */

export default function MapContainer() {
  const { parcels } = useParcels();
  const {
    selectedParcel,
    setSelectedParcel,
    groupMode,
    setGroupMode,
    groupedParcels,
    toggleGroupParcel,
    setGroupedParcels,
    listOpen,
    setListOpen,

    mapMode,
    setMapMode,
  } = useContext(ParcelContext);

  // Harita Modları (renk sadece çizgi rengi için)
  const MODES = useMemo(
    () => [
      { key: "ilac",   label: "İlaçlama Bilgisi",      color: "#3b82f6" },
      { key: "hasat",  label: "Hasat Haritası",        color: "#f59e0b" },
      { key: "sayim",  label: "Sayım Bilgisi",         color: "#8b5cf6" },
      { key: "gubre",  label: "Gübreleme",             color: "#10b981" },
    ],
    []
  );
  const currentStrokeColor =
    MODES.find((m) => m.key === mapMode)?.color || "#3b82f6";

  const strokeSelected = { color: "red", weight: 3, fillOpacity: 0.25 };

  const handleSelectAll = () => {
    if (!groupMode) return;
    const allIds = parcels.map((p) => p.id);
    setGroupedParcels?.(allIds);
  };

  return (
    <div className="map-root" style={{ height: "100%", width: "100%", position: "relative" }}>
      {/* Mod paneli + logo */}
      <div className="map-modes">
        <div className="modes-control">
          <div className="modes-logo">
            <img src={logo} alt="Logo" />
          </div>
          {MODES.map((m) => (
            <label
              key={m.key}
              className={`mode-chip ${mapMode === m.key ? "active" : ""}`}
              title={m.label}
            >
              <input
                type="radio"
                name="mapmode"
                value={m.key}
                checked={mapMode === m.key}
                onChange={() => setMapMode(m.key)} // seçimleri bozma
              />
              <span className="dot" style={{ background: m.color }} />
              <span className="txt">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Parsel Listeleri butonu (panelin altında) */}
      <button
        type="button"
        className="plist-trigger"
        onClick={() => setListOpen(true)}
        title="Parsel Listeleri"
      >
      </button>

      {/* Sağ üst: Çoklu Seçim */}
      <div className="group-toggle">
        <label className="group-toggle-inner">
          <input
            type="checkbox"
            checked={groupMode}
            onChange={(e) => setGroupMode(e.target.checked)}
          />
          <span>Çoklu Seçim</span>
        </label>
        {groupMode && (
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button type="button" className="group-select-all-btn" onClick={handleSelectAll}>
              Tümünü Seç
            </button>
          </div>
        )}
      </div>

      {/* Harita */}
      <LeafletMap
        center={[38.26984, 27.3991]}
        zoom={16}
        minZoom={1}
        maxZoom={21}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} // zoom butonları kapalı
      >
        <FocusController
          parcels={parcels}
          selectedParcel={selectedParcel}
          groupMode={groupMode}
          groupedParcels={groupedParcels}
        />

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

          // 🔹 Bu parselin (ilac/gubre moduna göre) son durumunu al
          const status = getParcelStatus(parsel, mapMode);

          // 🔹 Stil: seçiliyse kırmızı kenar, değilse mod rengi kenar
          const baseStroke = { color: currentStrokeColor, weight: 2, fillOpacity: 0.2 };
          const polyStyle = {
            ...(isSelected ? strokeSelected : baseStroke),
            // Durum varsa iç dolgu rengini ona göre boya
            ...(status ? { fillColor: status.color, fillOpacity: 0.35 } : {}),
          };

          // 🔹 Polygon merkezine ikon (varsa status)
          let center = null;
          try {
            if (parsel?.koordinatlar?.length) {
              center = L.polygon(parsel.koordinatlar).getBounds().getCenter();
            }
          } catch (_) {
            center = null;
          }

          const icon =
            status &&
            L.divIcon({
              className: "status-icon",
              html: `<div class="status-badge" title="${status.title}">${status.symbol}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

          return (
            <React.Fragment key={parsel.id}>
              <Polygon
                positions={parsel.koordinatlar}
                pathOptions={polyStyle}
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
              {status && center && (
                <Marker position={center} icon={icon} interactive={false} />
              )}
            </React.Fragment>
          );
        })}
      </LeafletMap>
    </div>
  );
}
