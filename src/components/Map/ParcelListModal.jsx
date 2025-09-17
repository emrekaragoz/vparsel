import React, { useMemo, useState, useContext } from "react";
import useParcels from "../../hooks/useParcels";
import { ParcelContext } from "../../contexts/ParcelContext";

// Helper fonksiyonları buraya taşıyın
const toFloatFlexible = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const s = String(v);
  if (s.includes(",")) {
    const cleaned = s
      .replace(/\./g, "")
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "");
    return parseFloat(cleaned) || 0;
  }
  const cleaned = s.replace(/,/g, "").replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
};

const nfInt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

export default function ParcelListModal({ open, onClose }) {
  const { parcels } = useParcels();
  const { setSelectedParcel } = useContext(ParcelContext);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParcels = useMemo(() => {
    if (!searchTerm.trim()) return parcels;
    const q = searchTerm.trim().toLowerCase();
    return parcels.filter((p) => {
      const pr = p.properties || {};
      const tanim = (p.info && p.info.tanim) || pr.tanim || "";
      const adaNo = pr.adaNo ?? p.ada ?? "";
      const parNo = pr.parselNo ?? p.parsel ?? "";
      return (
        tanim.toLowerCase().includes(q) ||
        String(adaNo).toLowerCase().includes(q) ||
        String(parNo).toLowerCase().includes(q)
      );
    });
  }, [searchTerm, parcels]);

  if (!open) return null;

  return (
    <div className="plist-root open">
      <div className="plist-backdrop" onClick={onClose} />
      <div
        className="plist-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Parsel Listeleri"
      >
        <div className="plist-header">
          <div className="plist-title">Parsel Listeleri</div>
          <button className="plist-close" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div style={{ padding: '0 16px 10px 16px' }}>
          <input
            type="text"
            placeholder="Parsel ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="plist-search"
            style={{ width: '100%', padding: '7px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15, marginBottom: 6 }}
          />
        </div>
        <div className="plist-list">
          {filteredParcels.map((p) => {
            const pr = p.properties || {};
            const tanim = (p.info && p.info.tanim) || pr.tanim || "-";
            const adaNo = pr.adaNo ?? p.ada ?? "-";
            const parNo = pr.parselNo ?? p.parsel ?? "-";
            const alan = pr.alan ?? p.alan ?? "-";

            const aM2 = toFloatFlexible(alan);
            const agacTop = Object.values(p.info?.agac || {}).reduce((s, v) => s + toFloatFlexible(v), 0);
            const fidanTop = Object.values(p.info?.fidan || {}).reduce((s, v) => s + toFloatFlexible(v), 0);
            const used = (agacTop + fidanTop) * 36;
            const pct = aM2 > 0 ? Math.min(100, (used / aM2) * 100) : 0;
            const red = [239, 68, 68], green = [34, 197, 94];
            const t = pct / 100, mix = red.map((r, i) => Math.round(r + (green[i] - r) * t));
            const barColor = `rgb(${mix.join(",")})`;

            return (
              <div
                key={p.id}
                className="plist-item"
                onClick={() => {
                  setSelectedParcel(p.id);
                  onClose();
                }}
                title="Parseli seç"
              >
                <div className="plist-row-1">{tanim}</div>
                <div className="plist-row-2">
                  <span className="pill-inline">Ada/Parsel: {adaNo} / {parNo}</span>
                  <span className="pill-inline">Alan: {nfInt.format(toFloatFlexible(alan))} m²</span>
                  <span className="pill-progress" role="img" aria-label={`Doluluk ${Math.round(pct)}%`}>
                    <span className="pill-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                    <span className="pill-progress-label">{Math.round(pct)}%</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}