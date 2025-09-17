import React, { useMemo, useState, useContext } from "react";
import useParcels from "../hooks/useParcels.js";
import { ParcelContext } from "../contexts/ParcelContext.jsx";

/* ---------- Helpers ---------- */
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
const nfArea = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

/* ---------- Mode definitions (column labels) ---------- */
const MODE_DEFS = {
  ilac: {
    title: "İlaçlama Bilgisi",
    columns: [
      "İlaç Marka",
      "Miktar",
      "Gözlem / Not",
      "Tarih",
      "Durum",
    ],
  },
  hasat: {
    title: "Hasat Haritası",
    columns: [
      "Tür",
      "HasatKg",
      "Gözlem/Not",
      "Tarih",
      "İşçiSayısı",
      "ÇalışılanSaat",
      "ÇıkanYağ",
      "Verim",
    ],
  },
  sayim: {
    title: "Sayım Bilgisi",
    columns: null, // will be set dynamically
  },
  gubre: {
    title: "Gübreleme",
    columns: [
      "Gübre Cinsi",
      "Miktar",
      "Gözlem/Not",
      "Tarih",
      "Durum",
    ],
  },
};

/* ---------- Summary calculators (many records → one row) ---------- */
function summarizeIlac(list) {
  const rows = [];
  list.forEach((p) => {
    const src = p.info?.ilaclama || p.properties?.ilaclama || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      rows.push({
        "İlaç Marka": e.marka ?? e.ilac ?? "-",
        Miktar: e.miktar ? nfArea.format(toFloatFlexible(e.miktar)) : "-",
        "Gözlem / Not": e.not ?? e.gozlem ?? "-",
        Tarih: e.tarih ?? "-",
        "Durum": e.durum ?? "-",
      });
    });
  });
  return { list: rows.length ? rows : [{
    "İlaç Marka": "-", Miktar: "-", "Gözlem / Not": "-", Tarih: "-", "Durum": "-",
  }] };
}

function summarizeHasat(list) {
  const rows = [];
  list.forEach((p) => {
    const src = p.info?.hasat || p.properties?.hasat || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      const hasatKg = toFloatFlexible(e.miktar ?? e.hasatKg);
      const cikanYag = toFloatFlexible(e.yag ?? e.cikanYag);
      const verim = hasatKg > 0 ? `${nfArea.format((cikanYag / hasatKg) * 100)}%` : "-";
      rows.push({
        Tür: e.urun ?? e.tur ?? "-",
        HasatKg: hasatKg ? nfInt.format(hasatKg) : "-",
        "Gözlem/Not": e.not ?? e.gozlem ?? "-",
        Tarih: e.tarih ?? "-",
        İşçiSayısı: e.isci ?? e.isciSayisi ? nfInt.format(toFloatFlexible(e.isci ?? e.isciSayisi)) : "-",
        ÇalışılanSaat: e.saat ?? e.calisilanSaat ? nfArea.format(toFloatFlexible(e.saat ?? e.calisilanSaat)) : "-",
        ÇıkanYağ: cikanYag ? nfInt.format(cikanYag) : "-",
        Verim: verim,
      });
    });
  });
  return { list: rows.length ? rows : [{
    Tür: "-", HasatKg: "-", "Gözlem/Not": "-", Tarih: "-", İşçiSayısı: "-", ÇalışılanSaat: "-", ÇıkanYağ: "-", Verim: "-",
  }] };
}

function summarizeSayim(list) {
  const typeSet = new Set();
  const agacCounts = {};
  const fidanCounts = {};
  let tarih = "04.09.2025";
  let durum = "Yapıldı";

  list.forEach((p) => {
    const ag = p.info?.agac || {};
    const fd = p.info?.fidan || {};
    const t = p.info?.tarih || p.properties?.sayimTarih;
    const d = p.info?.Durum || p.properties?.Durum; // <-- Yeni eklenen satır

    if (t) tarih = t;
    if (d) durum = d; // <-- Yeni eklenen satır

    for (const [k, v] of Object.entries(ag)) {
      if (toFloatFlexible(v) > 0) typeSet.add(k);
      agacCounts[k] = (agacCounts[k] || 0) + toFloatFlexible(v);
    }
    for (const [k, v] of Object.entries(fd)) {
      if (toFloatFlexible(v) > 0) typeSet.add(k);
      fidanCounts[k] = (fidanCounts[k] || 0) + toFloatFlexible(v);
    }
  });

  const types = Array.from(typeSet);
  const agacRow = { label: "Ağaç" };
  const fidanRow = { label: "Fidan" };
  
  agacRow.Toplam = types.reduce((sum, type) => sum + (agacCounts[type] > 0 ? agacCounts[type] : 0), 0);
  fidanRow.Toplam = types.reduce((sum, type) => sum + (fidanCounts[type] > 0 ? fidanCounts[type] : 0), 0);
  
  agacRow.Toplam = agacRow.Toplam ? nfInt.format(agacRow.Toplam) : "-";
  fidanRow.Toplam = fidanRow.Toplam ? nfInt.format(fidanRow.Toplam) : "-";

  types.forEach((type) => {
    agacRow[type.toUpperCase("tr-TR")] = agacCounts[type] > 0 ? nfInt.format(agacCounts[type]) : "-";
    fidanRow[type.toUpperCase("tr-TR")] = fidanCounts[type] > 0 ? nfInt.format(fidanCounts[type]) : "-";
  });
  
  agacRow.Tarih = tarih;
  fidanRow.Tarih = tarih;
  agacRow.Durum = durum; // <-- Yeni eklenen satır
  fidanRow.Durum = durum; // <-- Yeni eklenen satır

  return {
    columns: ["", ...types.map(t => t.toUpperCase("tr-TR")), "Toplam", "Tarih", "Durum"], // <-- Yeni eklenen sütun
    list: types.length ? [agacRow, fidanRow] : [{ label: "Ağaç" }, { label: "Fidan" }],
  };
}

function summarizeGubre(list) {
  const rows = [];
  list.forEach((p) => {
    const src = p.info?.gubre || p.properties?.gubre || [];
    (Array.isArray(src) ? src : []).forEach((e) => {
      rows.push({
        "Gübre Cinsi": e.cins ?? e.cinsi ?? e.gubreCinsi ?? "-",
        Miktar: e.miktar ? nfArea.format(toFloatFlexible(e.miktar)) : "-",
        "Gözlem/Not": e.not ?? e.gozlem ?? "-",
        Tarih: e.tarih ?? "-",
        "Durum(Yapıldı,Beklemede,Zamanı Geçti)": e.durum ?? "-",
      });
    });
  });
  return { list: rows.length ? rows : [{
    "Gübre Cinsi": "-", Miktar: "-", "Gözlem/Not": "-", Tarih: "-", "Durum": "-",
  }] };
}

/* ---------- Simple card component ---------- */
function Section({ title, children, className = "" }) {
  return (
    <section className={`sai-card ${className}`}>
      {title && <div className="sai-card-title">{title}</div>}
      <div className="sai-card-body">{children}</div>
    </section>
  );
}

/* ======================= MAIN COMPONENT ======================= */
export default function SelectedAreaInfo({ parcel }) {
  const { parcels } = useParcels();
  const { groupMode, groupedParcels, mapMode, setSelectedParcel } = useContext(ParcelContext);

  // ===== START: Parcel List (plist) Modal Logic =====
  const [openList, setOpenList] = useState(false);
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
  // ===== END: Parcel List (plist) Modal Logic =====

  /* Selection list (single/multi) */
  const selectedList = useMemo(() => {
    if (groupMode) return parcels.filter((p) => groupedParcels.includes(p.id));
    return parcel ? [parcel] : [];
  }, [groupMode, groupedParcels, parcels, parcel]);

  /* Top static row: Description • Parcel Info • Area */
  const base = useMemo(() => {
    let alanM2 = 0;
    selectedList.forEach((p) => {
      const props = p.properties ?? p ?? {};
      alanM2 += toFloatFlexible(props.alan ?? p.alan);
    });
    const donum = alanM2 > 0 ? alanM2 / 1000 : 0;

    const firstProps = selectedList[0]?.properties ?? selectedList[0] ?? {};
    const infoFirst = selectedList[0]?.info ?? {};
    const mahalle = firstProps.mahalleAd ?? firstProps.mahalle ?? "-";
    const ada = firstProps.adaNo ?? firstProps.ada ?? "-";
    const parselNo = firstProps.parselNo ?? firstProps.parsel ?? "-";
    const tarih = infoFirst.tarih  || "-";
    const durum = infoFirst.durum  || "-";
    const tanim = infoFirst.tanim || firstProps.tanim || "-";

    return { alanM2, donum, mahalle, ada, parselNo, tanim, tarih, durum };
  }, [selectedList]);

  /* Bottom single row: generate value based on mapMode */
  const modeSummary = useMemo(() => {
    if (mapMode === "sayim") {
      return summarizeSayim(selectedList);
    }
    switch (mapMode) {
      case "ilac": return summarizeIlac(selectedList);
      case "hasat": return summarizeHasat(selectedList);
      case "gubre": return summarizeGubre(selectedList);
      default: return summarizeIlac(selectedList);
    }
  }, [mapMode, selectedList]);

  let def = MODE_DEFS[mapMode] || MODE_DEFS.ilac;
  if (mapMode === "sayim" && modeSummary.columns) {
    def = { ...def, columns: modeSummary.columns };
  }

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9990 }}>
      <div style={{ maxWidth: 1100, margin: "2px auto" }}>
        <div className="sai-panel" style={{ padding: '8px 8px' }}>

          {selectedList.length ? (
            <>
              {/* 1) Static row */}
              <div className="sai-row-3">
                <Section title="Tanım">
                  <div className="sai-desc">{base.tanim}</div>
                </Section>

                <Section>
                  <div className="sai-kv">
                    <div>
                      <span className="key">Mahalle</span>
                      <span className="val">{base.mahalle}</span>
                    </div>
                    <div>
                      <span className="key">Ada / Parsel</span>
                      <span className="val">
                        {groupMode ? `${selectedList.length} parsel` : `${base.ada} / ${base.parselNo}`}
                      </span>
                    </div>
                  </div>
                </Section>

                <Section>
                  <div className="sai-metric">
                    {base.donum ? `${nfArea.format(base.donum)} dönüm` : "-"}
                  </div>
                  <div className="sai-sub">
                    ≈ {nfInt.format(base.alanM2)} m²
                  </div>
                </Section>
              </div>

              {/* 2) Bottom info: as a table */}
              <Section className="sai-card mode-table">
                <div className="mode-table-wrap" style={{ overflowX: 'auto', marginTop: 2, marginBottom: 2 }}>
                  <table className="mode-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {def.columns.map((col, idx) => (
                          <th key={col + idx} style={{ fontWeight: 700, padding: '3px 6px', borderBottom: '1px solid #e5e7eb', background: '#f3f4f6', color: '#222', textAlign: 'left', fontSize: 12 }}>
                            {col || (idx === 0 ? "" : col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(modeSummary.list) && modeSummary.list.length > 0 ? (
                        modeSummary.list.map((row, i) => (
                          <tr key={i}>
                            {def.columns.map((col, idx) => (
                              <td key={col + idx} style={{ padding: '3px 6px', borderBottom: '1px solid #f3f4f6', background: '#fff', color: '#111827', fontSize: 12, fontWeight: idx === 0 ? 700 : 400 }}>
                                {idx === 0 ? row.label : (row[col] != null && row[col] !== "" ? String(row[col]) : "-")}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          {def.columns.map((col, idx) => (
                            <td key={col + idx} style={{ padding: '3px 6px', borderBottom: '1px solid #f3f4f6', background: '#fff', color: '#111827', fontSize: 12 }}>-</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </>
          ) : (
            <div className="sai-empty">
              Henüz seçim yok. Haritadan parsel seçin veya listeden açın.
            </div>
          )}
        </div>
      </div>

      {/* ===== Parcel List Modal ===== */}
      <div className={`plist-root ${openList ? "open" : ""}`}>
        <div className="plist-backdrop" onClick={() => setOpenList(false)} />
        <div
          className="plist-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Parsel Listeleri"
        >
          <div className="plist-header">
            <div className="plist-title">Parsel Listeleri</div>
            <button className="plist-close" onClick={() => setOpenList(false)}>
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
                    setOpenList(false);
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
      {/* ===== /Modal ===== */}
    </div>
  );
}