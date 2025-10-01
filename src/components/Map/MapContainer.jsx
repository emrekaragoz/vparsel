import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
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
import ParcelListModal from "./ParcelListModal";

/** Seçime göre haritayı odaklar (tekli / çoklu) */
function FocusController({
  parcels,
  selectedParcel,
  groupMode,
  groupedParcels,
  resetView,
}) {
  const map = useMap();
  const { setSelectedParcel, setGroupMode, setGroupedParcels } =
    useContext(ParcelContext); // State yönetim fonksiyonlarını çağırın

  useEffect(() => {
    if (!map) return;

    // Reset view tetiklendiyse
    if (resetView) {
      // Değerleri context üzerinden sıfırlayın
      setSelectedParcel(null);
      setGroupMode(false);
      setGroupedParcels([]);
      map.setView([38.26984, 27.3991], 16);
      return;
    }

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
  }, [
    map,
    parcels,
    selectedParcel,
    groupMode,
    groupedParcels,
    resetView,
    setSelectedParcel,
    setGroupMode,
    setGroupedParcels,
  ]);

  return null;
}

/* ---------------- Durum/renk/ikon yardımcıları ---------------- */

const STATUS_MAP = {
  yapildi: { color: "#22f56fff", symbol: "✓", title: "Yapıldı" },
  beklemede: { color: "#f8a71aff", symbol: "🕒", title: "Beklemede" },
  gecikti: { color: "#fb3333ff", symbol: "❗", title: "Zamanı Geçti" },
};

// "Yapıldı" | "Beklemede" | "Zamanı Geçti" → anahtar
function normStatus(v) {
  if (!v) return null;
  const s = String(v).toLowerCase("tr-TR");
  if (s.includes("yap")) return "yapildi";
  if (s.includes("plan")) return "beklemede";
  if (s.includes("gec") || s.includes("gec")) return "gecikti";
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
//... (Mevcut kod)
function getParcelStatus(parcel, mapMode) {
  let src = null;

  if (mapMode === "sayim") {
    // "sayim" modu için durumu doğrudan 'info.Durum'dan alın.
    const durum = parcel?.info?.Durum;

    // Eğer durum yoksa veya tanımlı değilse "Yapıldı" olarak kabul edin.
    const effectiveDurum = durum || "Yapıldı";

    const key = normStatus(effectiveDurum);
    if (!key) return null;

    return { key, ...STATUS_MAP[key] };
  }

  // Mevcut "ilac" ve "gubre" modu mantığı devam eder
  if (mapMode === "ilac")
    src = parcel?.info?.ilaclama || parcel?.properties?.ilaclama;
  if (mapMode === "gubre")
    src = parcel?.info?.gubre || parcel?.properties?.gubre;

  if (!Array.isArray(src) || src.length === 0) return null;

  const latest = latestByDate(src);
  const key = normStatus(latest?.durum);
  if (!key) return null;

  return { key, ...STATUS_MAP[key] };
}
//... (Mevcut kod)

/* ---------------- /Durum yardımcıları ---------------- */

export default function MapContainer() {
  const [openList, setOpenList] = useState(false);
  // Demo: Seçili parselin bilgisiyle mail gönder

  const [resetView, setResetView] = useState(false);

  // Reset view işlemi için timer
  const resetTimerRef = useRef(null);

  const handleLogoClick = () => {
    // Reset view state'ini true yap
    setResetView(true);

    // 100ms sonra reset view state'ini false yap
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setResetView(false);
    }, 100);
  };

  const handleSendMail = () => {
    const p = parcels.find((x) => x.id === selectedParcel);
    if (!p) return alert("Seçili parsel yok!");
    const pr = p.properties || {};
    const tanim = (p.info && p.info.tanim) || pr.tanim || "-";
    const adaNo = pr.adaNo ?? p.ada ?? "-";
    const parselNo = pr.parselNo ?? p.parsel ?? "-";
    const donum = pr.alan ? (pr.alan / 1000).toFixed(2) : "-";
    //sendParcelMail({ tanim, adaNo, parselNo, donum, to_email: 'emrekaragoz352@gmail.com' });
  };
  const { parcels } = useParcels();
  const {
    selectedParcel,
    setSelectedParcel,
    groupMode,
    setGroupMode,
    groupedParcels,
    toggleGroupParcel,
    setGroupedParcels,

    mapMode,
    setMapMode,
  } = useContext(ParcelContext);

  const PRIMARY_BLUE = "#3b82f6";

  // Harita Modları (renk sadece çizgi rengi için)
  const MODES = useMemo(
    () => [
      { key: "sayim", label: "Sayım Bilgisi" },
      { key: "ilac", label: "İlaçlama Bilgisi" },
      { key: "hasat", label: "Hasat Haritası" },
      { key: "gubre", label: "Gübreleme" },
      { key: "analiz", label: "Analiz" },
    ],
    []
  );
  const currentStrokeColor = PRIMARY_BLUE;

  const strokeSelected = { color: "red", weight: 3, fillOpacity: 0.45 };

  const handleSelectAll = () => {
    if (!groupMode) return;
    const allIds = parcels.map((p) => p.id);
    setGroupedParcels?.(allIds);
  };

  return (
    <div
      className="map-root"
      style={{ height: "100%", width: "100%", position: "relative" }}
    >
      {/* Mod paneli + logo */}
      <div className="map-modes">
        <div className="modes-control">
          <div
            className="modes-logo"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          >
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
                onChange={() => setMapMode(m.key)}
              />
              {/* <span className="dot" style={{ background: m.color }} />  ← SİLİNDİ */}
              <span className="txt">{m.label}</span>
            </label>
          ))}
        </div>
      </div>
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
            <button
              type="button"
              className="group-select-all-btn"
              onClick={handleSelectAll}
            >
              Tümünü Seç
            </button>
          </div>
        )}
      </div>

      {/* Parsel Listeleri butonu - Çoklu Seçim butonunun altında */}
      <div className="parcel-list-toggle">
        <button
          type="button"
          className="group-toggle-btn"
          onClick={() => setOpenList(true)}
        >
          Parsel Listesi
        </button>
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
          resetView={resetView}
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
          let polyStyle;
          if (status) {
            polyStyle = {
              color: "#dedfe1ff",
              fillColor: status.color,
              weight: 2,
              fillOpacity: isSelected ? 0.9 : 0.4,
              opacity: 0.9,
            };
          } else {
            polyStyle = {
              color: currentStrokeColor, // = PRIMARY_BLUE
              fillColor: currentStrokeColor, // = PRIMARY_BLUE
              weight: 2,
              fillOpacity: isSelected ? 0.9 : 0.35,
              opacity: 0.9,
            };
          }

          // 🔹 Polygon merkezine ikon (varsa status)
          let position = null;
          try {
            if (parsel?.koordinatlar?.length) {
              const center = L.polygon(parsel.koordinatlar)
                .getBounds()
                .getCenter();

              // Merkez noktayı, ekran üzerinde 50 piksel sağa ve 25 piksel aşağı kaydır
              const pixelPoint = map.latLngToLayerPoint(center);
              const newPixelPoint = pixelPoint.add([50, 25]);
              position = map.layerPointToLatLng(newPixelPoint);
            }
          } catch (_) {
            position = null;
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
              {status && position && (
                <Marker position={position} icon={icon} interactive={false} />
              )}
            </React.Fragment>
          );
        })}
      </LeafletMap>

      <ParcelListModal open={openList} onClose={() => setOpenList(false)} />
    </div>
  );
}
